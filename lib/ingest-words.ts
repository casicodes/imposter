import type { StoredCategoryId } from "./db-categories";
import { createSupabaseAdmin } from "./supabase/admin";
import type { LlmWordsBatch } from "./word-generation-schema";

export type InsertWordsResult = {
  inserted: number;
  batchId: string;
};

export async function insertWordsBatch(
  batch: LlmWordsBatch,
): Promise<InsertWordsResult> {
  const supabase = createSupabaseAdmin();
  const batchId = crypto.randomUUID();

  const rows: {
    category: StoredCategoryId;
    word: string;
    hint_easy: string;
    hint_medium: string;
    hint_hard: string;
    batch_id: string;
    source: string;
  }[] = [];

  for (const entry of batch) {
    rows.push({
      category: entry.category as StoredCategoryId,
      word: entry.realWord.trim(),
      hint_easy: entry.hints.simple.trim(),
      hint_medium: entry.hints.medium.trim(),
      hint_hard: entry.hints.hard.trim(),
      batch_id: batchId,
      source: "llm",
    });
  }

  if (rows.length === 0) {
    throw new Error("No rows to insert");
  }

  const { error } = await supabase.from("game_words").insert(rows);
  if (error) {
    throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return { inserted: rows.length, batchId };
}
