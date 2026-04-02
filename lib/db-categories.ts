import type { CategoryId } from "./categories";

/** Categories stored in DB (`mix` is a filter, not a stored category). */
export const STORED_CATEGORY_IDS = [
  "food",
  "movies",
  "animals",
  "places",
  "sports",
  "science",
  "everyday",
] as const;

export type StoredCategoryId = (typeof STORED_CATEGORY_IDS)[number];

export function isStoredCategoryId(s: string): s is StoredCategoryId {
  return (STORED_CATEGORY_IDS as readonly string[]).includes(s);
}

export function isCategoryIdForDb(category: CategoryId): boolean {
  return category === "mix" || isStoredCategoryId(category);
}
