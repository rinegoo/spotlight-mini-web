export type SearchMode = "all" | "artist" | "title" | "lyrics";
export type BackFilter = "" | "yes" | "no";

export interface Song {
  /** Уникальный ключ («n» или «вкладка:n») — не для показа. */
  id: string;
  /** Номер песни в караоке-системе — его называют оператору. */
  number?: string;
  /** Название вкладки EnCore — только у песен не из основной базы. */
  tabName?: string;
  title: string;
  artist: string;
  backVocal: boolean;
  /** Есть отдельная дорожка с голосом (можно включить голос исполнителя). */
  vocalTrack?: boolean;
  /** Избранное заведения. */
  favorite?: boolean;
  format?: string;
  /** Ограничения (модуль restrictions): указание, которое обязательно показать у песни. */
  restrictions?: Restriction[];
  /** Нормализованные совпавшие слова по полям; "*" — совпало всё поле; lyrics — найдено в тексте. */
  matches?: { title?: string[]; artist?: string[]; lyrics?: string[] };
}

export interface Restriction {
  /** Вид, например "ru.inoagent". */
  kind: string;
  /** Кого касается — как в официальном реестре. */
  subject: string;
  /** Текст указания по установленной форме — показывать без изменений. */
  label: string;
  note?: string;
}

export interface ArtistFacet {
  name: string;
  count: number;
}

export interface SearchResponse {
  total: number;
  items: Song[];
  artists?: ArtistFacet[];
  correctedQuery?: string;
  partial?: boolean;
  tookMs: number;
}

export interface Stats {
  songs: number;
  artists: number;
  favorites?: number;
  /** Песен со словами текста — есть ли поиск «по тексту». */
  lyrics?: number;
  tabs?: { id: number; name: string; songs: number }[];
  adapter: string;
  kind?: "file" | "import";
  restrictions?: {
    policy: "label" | "hide" | "off";
    labeled: number;
    hidden: number;
    /** Размер шрифта указания относительно основного текста (по закону — 2). */
    labelScale: number;
  };
  loadedAt: string;
}

export interface SearchParams {
  q: string;
  mode: SearchMode;
  back: BackFilter;
  artist: string;
  favorites: boolean;
  offset: number;
  limit: number;
}

export class ApiError extends Error {
  constructor(public status: number) {
    super(`catalog api: ${status}`);
  }
}

export async function searchSongs(p: SearchParams, signal?: AbortSignal): Promise<SearchResponse> {
  const qs = new URLSearchParams();
  if (p.q) qs.set("q", p.q);
  if (p.mode !== "all") qs.set("mode", p.mode);
  if (p.back) qs.set("back", p.back);
  if (p.artist) qs.set("artist", p.artist);
  if (p.favorites) qs.set("fav", "1");
  qs.set("offset", String(p.offset));
  qs.set("limit", String(p.limit));
  const res = await fetch(`/api/search?${qs}`, { signal });
  if (!res.ok) throw new ApiError(res.status);
  return res.json();
}

export async function fetchStats(signal?: AbortSignal): Promise<Stats> {
  const res = await fetch("/api/stats", { signal });
  if (!res.ok) throw new ApiError(res.status);
  return res.json();
}
