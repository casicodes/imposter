/** Normalize for deduping seen words across sessions (client + server). */
export function normalizeWordForDedupe(word: string): string {
  return word.trim().toLowerCase();
}
