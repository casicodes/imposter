/**
 * Run locally:
 *   npm run export-offline-words
 *   npm run export-offline-words -- --from-file ./game_words-export.json
 *
 * Default mode needs .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Writes lib/offline-words-snapshot.json (default ~500 words; half to everyday).
 * Rows are deduped per category by **word + easy/medium/hard hints** (not word alone).
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

/** Stored categories except `everyday` — everyday gets its own budget first. */
const NON_EVERYDAY_CATEGORIES: StoredCategoryId[] = [
  "food",
  "movies",
  "animals",
  "places",
  "sports",
  "science",
];

const DEFAULT_FETCH_LIMIT = 6000;
const DEFAULT_TARGET_TOTAL = 500;
const DEFAULT_EVERYDAY_FRACTION = 0.5;

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

function rowIdentityKey(row: GameWordRow): string {
  return [
    normalizeWordForDedupe(row.word),
    normalizeWordForDedupe(row.hint_easy),
    normalizeWordForDedupe(row.hint_medium),
    normalizeWordForDedupe(row.hint_hard),
  ].join("\0");
}

function buildSnapshotFromRows(
  rows: GameWordRow[],
  targetTotal: number,
  everydayFraction: number,
): Record<StoredCategoryId, WordEntry[]> {
  const buckets = emptySnapshot();
  const seenInCategory: Record<StoredCategoryId, Set<string>> = {
    food: new Set(),
    movies: new Set(),
    animals: new Set(),
    places: new Set(),
    sports: new Set(),
    science: new Set(),
    everyday: new Set(),
  };

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
    const cat = row.category;
    const norm = normalizeWordForDedupe(row.word);
    if (!norm) continue;
    const idKey = rowIdentityKey(row);
    if (seenInCategory[cat].has(idKey)) continue;
    seenInCategory[cat].add(idKey);

    const entry: WordEntry = {
      word: row.word.trim(),
      hints: {
        easy: row.hint_easy.trim(),
        medium: row.hint_medium.trim(),
        hard: row.hint_hard.trim(),
      },
    };
    buckets[cat].push(entry);
  }

  const out = emptySnapshot();
  const frac = Math.min(1, Math.max(0, everydayFraction));
  const everydayTarget = Math.floor(targetTotal * frac);
  out.everyday = buckets.everyday.slice(
    0,
    Math.min(everydayTarget, buckets.everyday.length),
  );

  let remaining = targetTotal - out.everyday.length;
  const nOther = NON_EVERYDAY_CATEGORIES.length;
  let base = Math.floor(remaining / nOther);
  let rem = remaining % nOther;

  for (const cat of NON_EVERYDAY_CATEGORIES) {
    const want = base + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
    out[cat] = buckets[cat].slice(0, Math.min(want, buckets[cat].length));
  }

  function totalCount(o: Record<StoredCategoryId, WordEntry[]>): number {
    let s = 0;
    for (const c of STORED_CATEGORY_IDS) s += o[c].length;
    return s;
  }

  // Use remaining slots (e.g. everyday pool smaller than 50% target) to pull more
  // from any category that still has unused words, up to `targetTotal`.
  while (totalCount(out) < targetTotal) {
    let progressed = false;
    for (const c of STORED_CATEGORY_IDS) {
      if (totalCount(out) >= targetTotal) break;
      const pool = buckets[c];
      if (out[c].length >= pool.length) continue;
      out[c].push(pool[out[c].length]!);
      progressed = true;
    }
    if (!progressed) break;
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
    const fetchLimit = Math.max(
      1,
      Number(process.env.OFFLINE_EXPORT_FETCH_LIMIT) || DEFAULT_FETCH_LIMIT,
    );
    const { data, error } = await supabase
      .from("game_words")
      .select("category, word, hint_easy, hint_medium, hint_hard")
      .order("created_at", { ascending: false })
      .limit(fetchLimit);

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
  const rawTarget = process.env.OFFLINE_EXPORT_TARGET?.trim();
  const targetTotal = Math.max(
    1,
    rawTarget !== undefined && rawTarget !== ""
      ? Number(rawTarget)
      : DEFAULT_TARGET_TOTAL,
  );

  const rawFrac = process.env.OFFLINE_EXPORT_EVERYDAY_FRACTION?.trim();
  const parsedFrac =
    rawFrac !== undefined && rawFrac !== "" ? Number(rawFrac) : NaN;
  const everydayFraction = Number.isFinite(parsedFrac)
    ? Math.min(1, Math.max(0, parsedFrac))
    : DEFAULT_EVERYDAY_FRACTION;

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

  const out = buildSnapshotFromRows(rows, targetTotal, everydayFraction);
  const outPath = resolve(process.cwd(), "lib/offline-words-snapshot.json");
  writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");

  const n = STORED_CATEGORY_IDS.length;
  const total = STORED_CATEGORY_IDS.reduce((s, c) => s + out[c].length, 0);
  const breakdown = STORED_CATEGORY_IDS.map((c) => `${c}=${out[c].length}`).join(
    ", ",
  );
  console.log(
    `Wrote ${outPath} (${total} words; target=${targetTotal}, everydayFraction=${everydayFraction}). Breakdown: ${breakdown}.`,
  );
  if (total < targetTotal) {
    console.log(
      `Note: fewer than ${targetTotal} unique words exist in the fetched rows (per-category dedupe). Add more rows in Supabase or raise OFFLINE_EXPORT_FETCH_LIMIT.`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
