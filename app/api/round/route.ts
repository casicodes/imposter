import { NextResponse } from "next/server";
import type { CategoryId, Difficulty } from "@/lib/categories";
import {
  createGameRoundExcluding,
  createGameRoundFromPool,
} from "@/lib/game";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import { normalizeWordForDedupe } from "@/lib/word-normalize";
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
  excludeWords: z
    .array(z.string().max(200))
    .max(500)
    .optional()
    .default([])
    .transform((words) => {
      const out = new Set<string>();
      for (const w of words) {
        const n = normalizeWordForDedupe(w);
        if (n) out.add(n);
      }
      return [...out];
    }),
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

  const { excludeWords, ...config } = parsed.data;
  const excluded = new Set(excludeWords);

  if (!isSupabaseConfigured()) {
    return NextResponse.json(createGameRoundExcluding(config, excluded));
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.rpc("random_game_word", {
      p_category: config.category,
      p_exclude: excludeWords,
    });

    if (error) {
      console.error("random_game_word rpc error", error);
      return NextResponse.json(createGameRoundExcluding(config, excluded));
    }

    const rows = Array.isArray(data) ? data : data != null ? [data] : [];
    const row = rows[0];
    if (!row || typeof row !== "object") {
      return NextResponse.json(createGameRoundExcluding(config, excluded));
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
    return NextResponse.json(createGameRoundExcluding(config, excluded));
  }
}
