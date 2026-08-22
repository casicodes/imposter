import type { CategoryId, WordEntry, WordLanguage } from "./categories";
import nepaliWordsSnapshot from "./nepali-words-snapshot.json";
import offlineWordsSnapshot from "./offline-words-snapshot.json";

type OfflineSnapshot = Record<Exclude<CategoryId, "mix">, WordEntry[]>;

function buildWordsByCategory(snapshot: OfflineSnapshot): Record<CategoryId, WordEntry[]> {
  const food = snapshot.food ?? [];
  const movies = snapshot.movies ?? [];
  const animals = snapshot.animals ?? [];
  const places = snapshot.places ?? [];
  const sports = snapshot.sports ?? [];
  const science = snapshot.science ?? [];
  const everyday = snapshot.everyday ?? [];
  return {
    food,
    movies,
    animals,
    places,
    sports,
    science,
    everyday,
    mix: [
      ...food,
      ...movies,
      ...animals,
      ...places,
      ...sports,
      ...science,
      ...everyday,
    ],
  };
}

const english = buildWordsByCategory(offlineWordsSnapshot as OfflineSnapshot);
const nepali = buildWordsByCategory(nepaliWordsSnapshot as OfflineSnapshot);

/** Default English offline pack (also used as API fallback). */
export const WORDS_BY_CATEGORY = english;

export const WORDS_BY_LANGUAGE: Record<
  WordLanguage,
  Record<CategoryId, WordEntry[]>
> = {
  en: english,
  ne: nepali,
};

export function wordsForLanguage(
  language: WordLanguage,
): Record<CategoryId, WordEntry[]> {
  return WORDS_BY_LANGUAGE[language];
}
