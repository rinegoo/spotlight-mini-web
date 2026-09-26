export type SearchMode = "all" | "artist" | "title";
export type BackFilter = "" | "yes" | "no";

export interface Song {
  id: string;
  title: string;
  artist: string;
  backVocal: boolean;
  format?: string;
  /** Нормализованные совпавшие слова по полям; "*" — совпало всё поле. */
  matches?: { title?: string[]; artist?: string[] };
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
  adapter: string;
  loadedAt: string;
}

export interface SearchParams {
  q: string;
  mode: SearchMode;
  back: BackFilter;
  artist: string;
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
