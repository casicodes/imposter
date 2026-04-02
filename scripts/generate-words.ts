/**
 * Run locally: npx tsx scripts/generate-words.ts
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MISTRAL_API_KEY
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { generateWordsBatch } from "../lib/mistral";
import { insertWordsBatch } from "../lib/ingest-words";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  ) {
    console.error(
      "Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)",
    );
    process.exit(1);
  }
  const apiKey = process.env.MISTRAL_API_KEY?.trim();
  if (!apiKey) {
    console.error("Missing MISTRAL_API_KEY");
    process.exit(1);
  }

  const model = process.env.MISTRAL_MODEL?.trim() || "ministral-3b-2512";
  const wordsMin = Number(process.env.WORDS_BATCH_MIN) || 30;
  const wordsMax = Number(process.env.WORDS_BATCH_MAX) || 50;

  console.log("Calling Mistral…");
  const batch = await generateWordsBatch({
    apiKey,
    model,
    wordsMin,
    wordsMax,
  });
  console.log("Inserting into Supabase…");
  const { inserted, batchId } = await insertWordsBatch(batch);
  console.log(`Done. Inserted ${inserted} rows, batch_id=${batchId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
