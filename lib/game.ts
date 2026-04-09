import type { CategoryId, Difficulty, WordEntry } from "./categories";
import { normalizeWordForDedupe } from "./word-normalize";
import { WORDS_BY_CATEGORY } from "./words";

export type GameConfig = {
  playerCount: number;
  imposterCount: number;
  category: CategoryId;
  difficulty: Difficulty;
};

export type GameRound = GameConfig & {
  word: string;
  hint: string;
  /** Sorted ascending; length === `imposterCount`. */
  imposterIndices: number[];
};

function randomInt(maxExclusive: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % maxExclusive;
}

/** Uniform random subset of distinct indices in `[0, playerCount)`, sorted ascending. */
function pickRandomImposterIndices(
  playerCount: number,
  imposterCount: number,
): number[] {
  if (imposterCount < 1 || imposterCount >= playerCount) {
    throw new Error("Invalid imposter count for player count");
  }
  const indices = Array.from({ length: playerCount }, (_, i) => i);
  for (let i = 0; i < imposterCount; i++) {
    const j = i + randomInt(playerCount - i);
    const t = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = t;
  }
  return indices.slice(0, imposterCount).sort((a, b) => a - b);
}

export function createGameRoundFromPool(
  config: GameConfig,
  pool: WordEntry[],
): GameRound {
  if (pool.length === 0) {
    throw new Error("Word pool is empty");
  }
  const entry = pool[randomInt(pool.length)]!;
  const hint = entry.hints[config.difficulty];
  const imposterIndices = pickRandomImposterIndices(
    config.playerCount,
    config.imposterCount,
  );
  return {
    ...config,
    word: entry.word,
    hint,
    imposterIndices,
  };
}

export function createGameRound(config: GameConfig): GameRound {
  const pool = WORDS_BY_CATEGORY[config.category];
  return createGameRoundFromPool(config, pool);
}

function filterPoolExcluding(
  pool: WordEntry[],
  excluded: ReadonlySet<string>,
): WordEntry[] {
  if (excluded.size === 0) return pool;
  return pool.filter(
    (e) => !excluded.has(normalizeWordForDedupe(e.word)),
  );
}

/**
 * Picks a random word from the local pool, avoiding normalized words in `excluded`.
 * If every entry is excluded, falls back to the full pool.
 */
export function createGameRoundExcluding(
  config: GameConfig,
  excluded: ReadonlySet<string>,
): GameRound {
  const pool = WORDS_BY_CATEGORY[config.category];
  const filtered = filterPoolExcluding(pool, excluded);
  return createGameRoundFromPool(
    config,
    filtered.length > 0 ? filtered : pool,
  );
}
