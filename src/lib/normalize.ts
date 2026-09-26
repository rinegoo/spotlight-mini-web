// Та же нормализация, что и на сервере (server/internal/textnorm): нужна,
// чтобы сопоставить слова в выдаче с совпавшими термами для подсветки.
export function normalizeWord(word: string): string {
  let out = "";
  for (const ch of word.toLowerCase()) {
    if (ch === "ё") out += "е";
    else if (ch === "й") out += "й";
    else if ("'’‘`ʼ´".includes(ch)) continue;
    else out += ch.normalize("NFD").replace(/\p{Mn}/gu, "");
  }
  return out.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
