import type { GameConfig, GameRound } from "./game";
import { createGameRoundExcluding } from "./game";
import { getSeenWords } from "./seen-words";
import { normalizeWordForDedupe } from "./word-normalize";

function buildExcludedSet(): Set<string> {
  const out = new Set<string>();
  for (const w of getSeenWords()) {
    const n = normalizeWordForDedupe(w);
    if (n) out.add(n);
  }
  return out;
}

function localRound(config: GameConfig): GameRound {
  return createGameRoundExcluding(config, buildExcludedSet());
}

function shouldFallbackToLocal(status: number): boolean {
  return status === 408 || (status >= 500 && status <= 599);
}

export async function fetchGameRound(config: GameConfig): Promise<GameRound> {
  /** Nepali pack is bundled client-side only (not in Supabase yet). */
  if (config.wordLanguage === "ne") {
    return localRound(config);
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return localRound(config);
  }

  const excludeWords = getSeenWords();

  let res: Response;
  try {
    res = await fetch("/api/round", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, excludeWords }),
    });
  } catch {
    return localRound(config);
  }

  if (res.ok) {
    return (await res.json()) as GameRound;
  }

  if (shouldFallbackToLocal(res.status)) {
    return localRound(config);
  }

  let message = "Failed to start round";
  try {
    const err = (await res.json()) as { error?: string };
    if (typeof err.error === "string") message = err.error;
  } catch {
    /* ignore */
  }
  throw new Error(message);
}
