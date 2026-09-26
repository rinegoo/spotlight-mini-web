"use client";

import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  fetchStats,
  searchSongs,
  type BackFilter,
  type SearchMode,
  type SearchResponse,
  type Song,
  type Stats,
} from "@/lib/api";
import { Highlight } from "./Highlight";

const PAGE = 40;
const DEBOUNCE_MS = 200;

const MODES: { value: SearchMode; label: string }[] = [
  { value: "all", label: "Везде" },
  { value: "artist", label: "Исполнитель" },
  { value: "title", label: "Название" },
];
// Поиск по тексту — только если в каталоге есть слова текстов (импорт из EnCore).
const LYRICS_MODE = { value: "lyrics" as SearchMode, label: "Слова песни" };

const BACKS: { value: BackFilter; label: string }[] = [
  { value: "", label: "Все" },
  { value: "no", label: "Без бэк-вокала" },
  { value: "yes", label: "С бэк-вокалом" },
];

interface Results extends SearchResponse {
  key: string;
}

const fmt = new Intl.NumberFormat("ru-RU");

export function Catalog() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("all");
  const [back, setBack] = useState<BackFilter>("");
  const [artist, setArtist] = useState("");
  const [favorites, setFavorites] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  // null — ошибки нет; число — HTTP-статус; 0 — сеть.
  const [error, setError] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const key = JSON.stringify([query, mode, back, artist, favorites]);
  const modes = stats?.lyrics ? [...MODES, LYRICS_MODE] : MODES;
  const loading = results?.key !== key;

  useEffect(() => {
    const ctl = new AbortController();
    fetchStats(ctl.signal).then(setStats, () => {});
    return () => ctl.abort();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input]);

  // Новый поиск при изменении запроса или фильтров.
  useEffect(() => {
    const ctl = new AbortController();
    searchSongs({ q: query, mode, back, artist, favorites, offset: 0, limit: PAGE }, ctl.signal).then(
      (res) => {
        setResults({ ...res, key });
        setError(null);
        window.scrollTo({ top: 0 });
      },
      (err) => {
        if (!ctl.signal.aborted) {
          console.error(err);
          setError(err instanceof ApiError ? err.status : 0);
        }
      },
    );
    return () => ctl.abort();
  }, [key, query, mode, back, artist, favorites]);

  // Подгрузка следующей страницы при прокрутке до конца списка.
  const canLoadMore = !!results && !loading && !loadingMore && results.items.length < results.total;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !canLoadMore || !results) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        setLoadingMore(true);
        searchSongs({ q: query, mode, back, artist, favorites, offset: results.items.length, limit: PAGE })
          .then(
            (res) =>
              setResults((prev) =>
                prev && prev.key === results.key ? { ...prev, items: [...prev.items, ...res.items] } : prev,
              ),
            (err) => console.error(err),
          )
          .finally(() => setLoadingMore(false));
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [canLoadMore, results, query, mode, back, artist, favorites]);

  const pickArtist = (name: string) => {
    setArtist(name);
    setInput("");
    setQuery("");
    inputRef.current?.blur();
  };

  const reset = () => {
    setInput("");
    setQuery("");
    setArtist("");
    setFavorites(false);
    inputRef.current?.focus();
  };

  const items = results?.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-background/95 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur sm:px-6">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h1 className="shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight">
            <button type="button" onClick={reset} className="cursor-pointer">
              Каталог песен
            </button>
          </h1>
          {stats && (
            <p className="text-right text-sm text-muted">
              {fmt.format(stats.songs)} песен · {fmt.format(stats.artists)} исполнителей
            </p>
          )}
        </div>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(input.trim());
            inputRef.current?.blur();
          }}
          className="relative"
        >
          <input
            ref={inputRef}
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder(mode, !!stats?.lyrics)}
            aria-label="Поиск песни"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="h-14 w-full rounded-2xl border border-line bg-surface pl-5 pr-14 text-lg outline-none placeholder:text-muted focus:border-accent [&::-webkit-search-cancel-button]:hidden"
          />
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput("");
                inputRef.current?.focus();
              }}
              aria-label="Очистить"
              className="absolute right-2 top-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-2xl text-muted hover:bg-line"
            >
              ×
            </button>
          )}
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <Segmented options={modes} value={mode} onChange={setMode} />
          <Segmented options={BACKS} value={back} onChange={setBack} />
          {!!stats?.favorites && (
            <button
              type="button"
              onClick={() => setFavorites((v) => !v)}
              aria-pressed={favorites}
              className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                favorites
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line bg-surface text-muted hover:text-foreground"
              }`}
            >
              ★ Избранное
            </button>
          )}
        </div>

        {artist && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-muted">Исполнитель:</span>
            <button
              type="button"
              onClick={() => setArtist("")}
              className="flex cursor-pointer items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg"
            >
              {artist} <span aria-hidden>×</span>
              <span className="sr-only">снять фильтр</span>
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-6">
        {results?.artists && results.artists.length > 0 && !loading && (
          <div className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
            {results.artists.map((a) => (
              <button
                key={a.name}
                type="button"
                onClick={() => pickArtist(a.name)}
                className="shrink-0 cursor-pointer rounded-full border border-line bg-surface px-4 py-2 text-sm hover:border-accent"
              >
                {a.name} <span className="text-muted">{a.count}</span>
              </button>
            ))}
          </div>
        )}

        <Status results={results} loading={loading} error={error} query={query} />

        <ul className="divide-y divide-line">
          {items.map((s) => (
            <SongRow key={s.id} song={s} onArtist={pickArtist} />
          ))}
        </ul>
        <div ref={sentinel} />
        {loadingMore && <p className="py-6 text-center text-muted">Загрузка…</p>}
      </main>
    </div>
  );
}

function Status({
  results,
  loading,
  error,
  query,
}: {
  results: Results | null;
  loading: boolean;
  error: number | null;
  query: string;
}) {
  if (error === 503) {
    return <p className="py-6 text-center text-danger">Каталог ещё не загружен. Попробуйте через минуту.</p>;
  }
  if (error !== null) {
    return <p className="py-6 text-center text-danger">Сервер каталога недоступен. Попробуйте ещё раз.</p>;
  }
  if (!results) {
    return <p className="py-6 text-center text-muted">Загрузка…</p>;
  }
  const dim = loading ? "opacity-50" : "";
  if (results.total === 0) {
    return (
      <p className={`py-10 text-center text-lg text-muted ${dim}`}>
        Ничего не найдено{query && <> по запросу «{query}»</>}
      </p>
    );
  }
  return (
    <div className={`py-2 text-sm text-muted ${dim}`}>
      {results.correctedQuery && (
        <p className="text-foreground">
          Показаны результаты для «<b>{results.correctedQuery}</b>» — запрос был набран в другой раскладке
        </p>
      )}
      {results.partial && <p className="text-foreground">Точных совпадений нет — показаны похожие</p>}
      <p>Найдено: {fmt.format(results.total)}</p>
    </div>
  );
}

function SongRow({ song, onArtist }: { song: Song; onArtist: (name: string) => void }) {
  const lyricHits = song.matches?.lyrics;
  return (
    <li className="flex items-center gap-4 py-3">
      <div className="w-20 shrink-0 text-right font-mono text-xl font-semibold tabular-nums text-accent sm:w-24 sm:text-2xl">
        {song.number ?? song.id}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-lg font-medium leading-snug">
          {song.favorite && (
            <span title="Избранное заведения" className="mr-1.5 text-accent">
              ★
            </span>
          )}
          <Highlight text={song.title} terms={song.matches?.title} />
        </div>
        <button
          type="button"
          onClick={() => onArtist(song.artist)}
          className="cursor-pointer text-left text-base text-muted hover:text-foreground"
        >
          <Highlight text={song.artist} terms={song.matches?.artist} />
        </button>
        {lyricHits && lyricHits.length > 0 && (
          <div className="truncate text-sm text-muted">
            в тексте: <mark>{lyricHits.slice(0, 5).join(", ")}</mark>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
        {song.tabName && (
          <span title="Вкладка в EnCore" className={`${badge} border-accent text-accent`}>
            {song.tabName}
          </span>
        )}
        {song.vocalTrack && (
          <span title="Есть дорожка с голосом исполнителя" className={badge}>
            голос
          </span>
        )}
        {song.backVocal && (
          <span title="С бэк-вокалом" className={badge}>
            бэк
          </span>
        )}
      </div>
    </li>
  );
}

function placeholder(mode: SearchMode, hasLyrics: boolean): string {
  switch (mode) {
    case "artist":
      return "Исполнитель";
    case "title":
      return "Название песни";
    case "lyrics":
      return "Строчка или слова из песни";
  }
  return hasLyrics ? "Исполнитель, песня или строчка" : "Исполнитель или название";
}

const badge = "rounded-md border border-line px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted";

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex max-w-full overflow-x-auto rounded-xl border border-line bg-surface p-1 [scrollbar-width:none]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
            value === o.value ? "bg-accent text-accent-fg" : "text-muted hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
