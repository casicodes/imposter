import { NextResponse } from "next/server";
import { generateWordsBatch } from "@/lib/mistral";
import { insertWordsBatch } from "@/lib/ingest-words";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runIngest();
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runIngest();
}

async function runIngest() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 503 },
    );
  }

  const apiKey = process.env.MISTRAL_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "MISTRAL_API_KEY is not set" },
      { status: 503 },
    );
  }

  const model = process.env.MISTRAL_MODEL?.trim() || "ministral-3b-2512";
  const wordsMin = Number(process.env.WORDS_BATCH_MIN) || 30;
  const wordsMax = Number(process.env.WORDS_BATCH_MAX) || 50;

  try {
    const batch = await generateWordsBatch({
      apiKey,
      model,
      wordsMin,
      wordsMax,
    });
    const { inserted, batchId } = await insertWordsBatch(batch);
    return NextResponse.json({ ok: true, inserted, batchId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ingest failed";
    console.error("ingest-words", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
