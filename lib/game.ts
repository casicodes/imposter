import type { CategoryId, Difficulty, WordEntry } from "./categories";
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
