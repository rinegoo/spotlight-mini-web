import { normalizeWord } from "@/lib/normalize";

// Слово вместе с апострофами внутри: «IT'S», «DOGGIN’».
const WORD = /[\p{L}\p{N}'’‘`ʼ´]+/gu;

export function Highlight({ text, terms }: { text: string; terms?: string[] }) {
  if (!terms?.length) return <>{text}</>;
  if (terms.includes("*")) return <mark>{text}</mark>;

  const set = new Set(terms);
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(WORD)) {
    const tokens = normalizeWord(m[0]).split(" ");
    if (!tokens.some((t) => set.has(t))) continue;
    parts.push(text.slice(last, m.index), <mark key={m.index}>{m[0]}</mark>);
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}
