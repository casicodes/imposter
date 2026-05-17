import type { CategoryId, WordEntry } from "./categories";
import offlineWordsSnapshot from "./offline-words-snapshot.json";

type OfflineSnapshot = Record<
  Exclude<CategoryId, "mix">,
  WordEntry[]
>;

const snapshot = offlineWordsSnapshot as OfflineSnapshot;

const food = snapshot.food ?? [];
const movies = snapshot.movies ?? [];
const animals = snapshot.animals ?? [];
const places = snapshot.places ?? [];
const sports = snapshot.sports ?? [];
const science = snapshot.science ?? [];
const everyday = snapshot.everyday ?? [];

export const WORDS_BY_CATEGORY: Record<CategoryId, WordEntry[]> = {
  food,
  movies,
  animals,
  places,
  sports,
  science,
  everyday,
  mix: [...food, ...movies, ...animals, ...places, ...sports, ...science, ...everyday],
};
