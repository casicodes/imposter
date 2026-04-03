import type { CategoryId, Difficulty, WordEntry } from "./categories";
import { normalizeWordForDedupe } from "./word-normalize";
import { WORDS_BY_CATEGORY } from "./words";

export type GameConfig = {
  playerCount: number;
  category: CategoryId;
  difficulty: Difficulty;
};

export type GameRound = GameConfig & {
  word: string;
  hint: string;
  imposterIndex: number;
};

function randomInt(maxExclusive: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % maxExclusive;
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
  const imposterIndex = randomInt(config.playerCount);
  return {
    ...config,
    word: entry.word,
    hint,
    imposterIndex,
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
