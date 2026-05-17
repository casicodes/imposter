/**
 * Run locally:
 *   npm run export-offline-words
 *   npm run export-offline-words -- --from-file ./game_words-export.json
 *
 * Default mode needs .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Writes lib/offline-words-snapshot.json (~120–150 words by default).
 *
 * --from-file: JSON array of { category, word, hint_easy, hint_medium, hint_hard }
 * (e.g. saved from Supabase SQL results when Node cannot reach the API).
 */

import { config } from "dotenv";
import { lookup } from "node:dns/promises";
import { setDefaultResultOrder } from "node:dns";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { WordEntry } from "../lib/categories";
import {
  isStoredCategoryId,
  STORED_CATEGORY_IDS,
  type StoredCategoryId,
} from "../lib/db-categories";
import { createSupabaseAdmin } from "../lib/supabase/admin";
import { normalizeWordForDedupe } from "../lib/word-normalize";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

type GameWordRow = {
  category: string;
  word: string;
  hint_easy: string;
  hint_medium: string;
  hint_hard: string;
};

function parseArgs(argv: string[]): { fromFile: string | null } {
  let fromFile: string | null = null;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--from-file" && argv[i + 1]) {
      fromFile = argv[i + 1]!;
      i += 1;
    }
  }
  return { fromFile };
}

function logFetchFailureHint(url: string): void {
  try {
    const host = new URL(url).host;
    console.error(
      `Could not reach Supabase host "${host}". Check VPN/firewall, that the project is up, and that NEXT_PUBLIC_SUPABASE_URL has no typos.`,
    );
    console.error(
      "If the project is on the free tier, open the Supabase dashboard and confirm the project is not paused.",
    );
    console.error(
      "Workaround: run a SQL export in the Supabase SQL editor, save rows as JSON, then:",
      `npm run export-offline-words -- --from-file ./your-export.json`,
    );
  } catch {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL does not look like a valid URL (expected https://….supabase.co).",
    );
  }
}

function formatSupabaseError(error: { message: string; cause?: unknown }): string {
  const parts = [error.message];
  if (error.cause != null) {
    parts.push(
      `cause: ${error.cause instanceof Error ? error.cause.message : String(error.cause)}`,
    );
    if (error.cause instanceof Error && "code" in error.cause) {
      parts.push(`code: ${String((error.cause as { code?: string }).code)}`);
    }
  }
  return parts.join(" — ");
}

function emptySnapshot(): Record<StoredCategoryId, WordEntry[]> {
  return {
    food: [],
    movies: [],
    animals: [],
    places: [],
    sports: [],
    science: [],
    everyday: [],
  };
}

function buildSnapshotFromRows(
  rows: GameWordRow[],
  targetTotal: number,
): Record<StoredCategoryId, WordEntry[]> {
  const buckets = emptySnapshot();
  const seenNorm = new Set<string>();

  for (const row of rows) {
    if (!isStoredCategoryId(row.category)) continue;
    if (
      typeof row.word !== "string" ||
      typeof row.hint_easy !== "string" ||
      typeof row.hint_medium !== "string" ||
      typeof row.hint_hard !== "string"
    ) {
      continue;
    }
    const norm = normalizeWordForDedupe(row.word);
    if (!norm || seenNorm.has(norm)) continue;
    seenNorm.add(norm);

    const entry: WordEntry = {
      word: row.word.trim(),
      hints: {
        easy: row.hint_easy.trim(),
        medium: row.hint_medium.trim(),
        hard: row.hint_hard.trim(),
      },
    };
    buckets[row.category].push(entry);
  }

  const n = STORED_CATEGORY_IDS.length;
  const base = Math.floor(targetTotal / n);
  let remainder = targetTotal % n;

  const out = emptySnapshot();
  for (const cat of STORED_CATEGORY_IDS) {
    const want = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    const pool = buckets[cat];
    out[cat] = pool.slice(0, Math.min(want, pool.length));
  }

  return out;
}

function parseRowsJson(raw: string): GameWordRow[] {
  const parsed: unknown = JSON.parse(raw);
  const arr: unknown = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        "data" in parsed &&
        Array.isArray((parsed as { data: unknown }).data)
      ? (parsed as { data: unknown[] }).data
      : null;
  if (!Array.isArray(arr)) {
    throw new Error(
      'Expected a JSON array of rows, or { "data": [ ... ] }, with category, word, hint_easy, hint_medium, hint_hard',
    );
  }
  return arr as GameWordRow[];
}

async function assertSupabaseHostResolvable(supabaseUrl: string): Promise<void> {
  let host: string;
  try {
    host = new URL(supabaseUrl).host;
  } catch {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL (expected https://<project-ref>.supabase.co).",
    );
    throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL.");
  }

  try {
    const r = await lookup(host, { verbatim: true });
    console.log(`DNS: "${host}" resolved: ${r.address}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("DNS lookup failed for Supabase URL host:", msg);
    if (msg.includes("ENOTFOUND") || msg.includes("NXDOMAIN")) {
      console.error(
        'ENOTFOUND means this hostname does not exist in DNS — often a typo in NEXT_PUBLIC_SUPABASE_URL or a deleted/old project. Open Supabase → Settings → API and copy "Project URL" exactly into .env.local.',
      );
      throw new Error(`Hostname not found: ${host}`);
    }
  }
}

async function fetchRowsFromSupabaseWithRetry(
  url: string,
): Promise<GameWordRow[]> {
  setDefaultResultOrder("ipv4first");
  await assertSupabaseHostResolvable(url);

  const maxAttempts = 3;
  let lastError: { message: string; cause?: unknown } | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("game_words")
      .select("category, word, hint_easy, hint_medium, hint_hard")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!error) {
      return (Array.isArray(data) ? data : []) as GameWordRow[];
    }

    lastError = error as { message: string; cause?: unknown };
    const retryable =
      typeof error.message === "string" &&
      error.message.includes("fetch failed");

    if (attempt < maxAttempts && retryable) {
      const delayMs = 800 * attempt;
      console.error(
        `Attempt ${attempt}/${maxAttempts} failed (${error.message}), retrying in ${delayMs}ms…`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
      continue;
    }
    break;
  }

  console.error(
    "Supabase query failed:",
    lastError ? formatSupabaseError(lastError) : "unknown error",
  );
  if (
    lastError &&
    typeof lastError.message === "string" &&
    lastError.message.includes("fetch failed")
  ) {
    logFetchFailureHint(url);
  }
  throw new Error("Supabase game_words export failed after retries.");
}

async function main() {
  const { fromFile } = parseArgs(process.argv);
  const targetTotal = Math.max(
    1,
    Number(process.env.OFFLINE_EXPORT_TARGET) || 130,
  );

  let rows: GameWordRow[];

  if (fromFile) {
    const abs = resolve(process.cwd(), fromFile);
    if (!existsSync(abs)) {
      console.error(`File not found: ${abs}`);
      console.error(
        "Create that file first. Quick test: cp scripts/sample-game-words-for-export.json game-words.json",
      );
      console.error(
        "Real data: in Supabase SQL editor run a query that returns one JSON array (see README), save the cell as your .json file, then:",
      );
      console.error(
        '  npm run export-offline-words -- --from-file ./game-words.json',
      );
      process.exit(1);
    }
    const raw = readFileSync(abs, "utf8");
    rows = parseRowsJson(raw);
    console.error(`Loaded ${rows.length} rows from ${abs}`);
  } else {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) {
      console.error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
      );
      console.error(
        "Or pass a JSON export: npm run export-offline-words -- --from-file ./export.json",
      );
      process.exit(1);
    }
    rows = await fetchRowsFromSupabaseWithRetry(url);
  }

  const out = buildSnapshotFromRows(rows, targetTotal);
  const outPath = resolve(process.cwd(), "lib/offline-words-snapshot.json");
  writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");

  const n = STORED_CATEGORY_IDS.length;
  const total = STORED_CATEGORY_IDS.reduce((s, c) => s + out[c].length, 0);
  console.log(`Wrote ${outPath} (${total} words across ${n} categories).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
