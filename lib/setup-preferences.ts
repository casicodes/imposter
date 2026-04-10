import { z } from "zod";
import type { CategoryId, Difficulty } from "@/lib/categories";

const STORAGE_KEY = "imposter-setup-preferences-v1";

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;
const MIN_IMPOSTERS = 1;

const categoryIdSchema = z.enum([
  "food",
  "movies",
  "animals",
  "places",
  "sports",
  "science",
  "everyday",
  "mix",
]);

const storedSchema = z.object({
  playerCount: z.number().int(),
  imposterCount: z.number().int(),
  category: categoryIdSchema,
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export type SetupPreferences = {
  playerCount: number;
  imposterCount: number;
  category: CategoryId;
  difficulty: Difficulty;
};

export const DEFAULT_SETUP_PREFERENCES: SetupPreferences = {
  playerCount: 4,
  imposterCount: 1,
  category: "everyday",
  difficulty: "hard",
};

function clampPlayerCount(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_SETUP_PREFERENCES.playerCount;
  return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Math.trunc(n)));
}

function clampImposterCount(imposters: number, playerCount: number): number {
  const maxImposters = playerCount - 1;
  if (!Number.isFinite(imposters)) return DEFAULT_SETUP_PREFERENCES.imposterCount;
  return Math.min(maxImposters, Math.max(MIN_IMPOSTERS, Math.trunc(imposters)));
}

function normalize(raw: unknown): SetupPreferences {
  const parsed = storedSchema.safeParse(raw);
  if (!parsed.success) return DEFAULT_SETUP_PREFERENCES;
  const playerCount = clampPlayerCount(parsed.data.playerCount);
  const imposterCount = clampImposterCount(
    parsed.data.imposterCount,
    playerCount,
  );
  return {
    playerCount,
    imposterCount,
    category: parsed.data.category,
    difficulty: parsed.data.difficulty,
  };
}

/** Read last setup from localStorage, or defaults if missing / invalid. */
export function readSetupPreferences(): SetupPreferences {
  if (typeof window === "undefined") return DEFAULT_SETUP_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return DEFAULT_SETUP_PREFERENCES;
    const parsed: unknown = JSON.parse(raw);
    return normalize(parsed);
  } catch {
    return DEFAULT_SETUP_PREFERENCES;
  }
}

/** Persist setup so the next session restores the same controls. */
export function writeSetupPreferences(prefs: SetupPreferences): void {
  if (typeof window === "undefined") return;
  const playerCount = clampPlayerCount(prefs.playerCount);
  const imposterCount = clampImposterCount(prefs.imposterCount, playerCount);
  const payload: SetupPreferences = {
    playerCount,
    imposterCount,
    category: prefs.category,
    difficulty: prefs.difficulty,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota or private mode */
  }
}
