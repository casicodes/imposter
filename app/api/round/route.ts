import { NextResponse } from "next/server";
import type { CategoryId, Difficulty } from "@/lib/categories";
import { createGameRound, createGameRoundFromPool } from "@/lib/game";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { z } from "zod";

const bodySchema = z.object({
  playerCount: z.number().int().min(3).max(12),
  category: z.enum([
    "food",
    "movies",
    "animals",
    "places",
    "sports",
    "science",
    "everyday",
    "mix",
  ]) satisfies z.ZodType<CategoryId>,
  difficulty: z.enum(["easy", "medium", "hard"]) satisfies z.ZodType<Difficulty>,
});

type GameWordRow = {
  word: string;
  hint_easy: string;
  hint_medium: string;
  hint_hard: string;
};

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const config = parsed.data;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(createGameRound(config));
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.rpc("random_game_word", {
      p_category: config.category,
    });

    if (error) {
      console.error("random_game_word rpc error", error);
      return NextResponse.json(createGameRound(config));
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== "object") {
      return NextResponse.json(createGameRound(config));
    }

    const r = row as GameWordRow;
    const entry = {
      word: r.word,
      hints: {
        easy: r.hint_easy,
        medium: r.hint_medium,
        hard: r.hint_hard,
      },
    };

    return NextResponse.json(createGameRoundFromPool(config, [entry]));
  } catch (e) {
    console.error("round route", e);
    return NextResponse.json(createGameRound(config));
  }
}
