import { normalizeWordForDedupe } from "./word-normalize";

const STORAGE_KEY = "imposter-seen-words-v1";
const MAX_STORED = 5000;

function parseStored(raw: string | null): string[] {
  if (raw == null || raw === "") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

/** Words already used on this browser (normalized). For round requests. */
export function getSeenWords(): string[] {
  if (typeof window === "undefined") return [];
  return parseStored(localStorage.getItem(STORAGE_KEY));
}

/** Persist a word after a round is chosen so it is less likely to repeat. */
export function rememberSeenWord(word: string): void {
  if (typeof window === "undefined") return;
  const key = normalizeWordForDedupe(word);
  if (!key) return;
  const prev = parseStored(localStorage.getItem(STORAGE_KEY));
  if (prev.includes(key)) return;
  const next = [...prev, key];
  const trimmed =
    next.length > MAX_STORED ? next.slice(next.length - MAX_STORED) : next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota or private mode — skip */
  }
}
