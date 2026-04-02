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

export type WordEntry = {
  word: string;
  hints: Record<Difficulty, string>;
};
