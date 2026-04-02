import { z } from "zod";
import { STORED_CATEGORY_IDS } from "./db-categories";

const storedCategorySchema = z.enum(
  STORED_CATEGORY_IDS as unknown as [string, ...string[]],
);

/** One token only (hyphens allowed); matches "Find the Imposter" hint style. */
const singleWordHint = z
  .string()
  .min(1)
  .max(48)
  .refine((s) => !/\s/.test(s.trim()), "each hint must be a single word (no spaces)");

export const llmWordRowSchema = z.object({
  category: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(storedCategorySchema),
  realWord: z.string().min(1).max(120),
  hints: z.object({
    simple: singleWordHint,
    medium: singleWordHint,
    hard: singleWordHint,
  }),
});

export type LlmWordRow = z.output<typeof llmWordRowSchema>;
export type LlmWordsBatch = LlmWordRow[];

const MIN_BATCH = 30;
const MAX_BATCH = 50;

export const llmWordsArraySchema = z
  .array(llmWordRowSchema)
  .min(MIN_BATCH)
  .max(MAX_BATCH)
  .superRefine((arr, ctx) => {
    const keys = arr.map((r) => r.realWord.trim().toLowerCase());
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate realWord values (case-insensitive)",
      });
    }
    const cats = new Set(arr.map((r) => r.category));
    for (const c of STORED_CATEGORY_IDS) {
      if (!cats.has(c)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing at least one word for category "${c}"`,
        });
      }
    }
  });

function extractEntriesArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && typeof raw === "object" && "entries" in raw) {
    const entries = (raw as { entries: unknown }).entries;
    if (Array.isArray(entries)) {
      return entries;
    }
  }
  throw new Error(
    'Expected JSON array of word objects, or object with "entries" array',
  );
}

export function parseLlmWordsJson(text: string): LlmWordsBatch {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const payload = jsonMatch?.[1]?.trim() ?? trimmed;
  let raw: unknown;
  try {
    raw = JSON.parse(payload) as unknown;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON";
    const preview = payload.slice(0, 400).replace(/\s+/g, " ");
    throw new Error(`LLM JSON parse failed: ${msg}. Start of payload: ${preview}`);
  }
  const arr = extractEntriesArray(raw);
  return llmWordsArraySchema.parse(arr);
}
