export type CategoryId =
  | "food"
  | "movies"
  | "animals"
  | "places"
  | "sports"
  | "science"
  | "everyday"
  | "mix";

export type Difficulty = "easy" | "medium" | "hard";

/** `en` = English words; `ne` = Nepali Devanagari words and hints. */
export type WordLanguage = "en" | "ne";

export type WordEntry = {
  word: string;
  hints: Record<Difficulty, string>;
};
