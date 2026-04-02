import { ZodError } from "zod";
import { STORED_CATEGORY_IDS } from "./db-categories";
import { parseLlmWordsJson, type LlmWordsBatch } from "./word-generation-schema";

const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";

type MistralChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

export type GenerateWordsOptions = {
  apiKey: string;
  /** e.g. ministral-3b-2512, mistral-small-latest */
  model?: string;
  /** Inclusive; default 30 */
  wordsMin?: number;
  /** Inclusive; default 50 */
  wordsMax?: number;
};

/**
 * System instructions for the batch word generator (aligned with Supabase + app categories).
 */
const SYSTEM_PROMPT = `You are the word generator AI for the game "Find the Imposter". Your task is to generate words and hints for offline storage in a database. Follow these rules exactly.

Task:
- Generate between MIN_COUNT and MAX_COUNT entries total (the user message states the exact inclusive range).
- Spread words across ALL of these categories: ${STORED_CATEGORY_IDS.join(", ")}.
- Each entry is one secret "realWord" players try to guess; the imposter does not see it.
- For each realWord, produce exactly THREE hints as single English words only (no spaces, no punctuation except hyphen if absolutely needed for a compound): simple → medium → hard.

Category field:
- Must be exactly one of: ${STORED_CATEGORY_IDS.join(", ")} (lowercase slugs). These map to: food & drink; movies & TV; animals; places; sports; science; everyday objects. Pick the best-matching slug per word.

Hint rules:
1. Simple: obvious but not trivial; recognizable; may allow playful or double meaning; still ONE word.
2. Medium: more indirect — metaphorical, symbolic, or contextual; avoid the most obvious association; ONE word.
3. Hard: abstract, tricky, associative, clever; may support multiple interpretations; requires thought; avoid direct synonyms of the realWord, obvious pairings, plurals of the answer, or substrings of the realWord; ONE word.

Output rules:
- Output ONLY one JSON object (no markdown, no prose). Root shape: {"entries":[...]} where "entries" is the array of word objects.
- Use normal JSON strings only: ASCII double quotes; escape any " inside a string as \\".
- Schema per array element:
  {"category":"<slug>","realWord":"<string>","hints":{"simple":"<one word>","medium":"<one word>","hard":"<one word>"}}

Quality rules:
- No duplicate realWord values (case-insensitive).
- Each category slug must appear at least once.
- Hints must clearly increase in difficulty from simple to hard.
- Keep realWord concise (usually one word; short phrases only if the concept demands it, e.g. a proper name).
- Content must be JSON-ready for upload to Supabase.`;

const CATEGORY_CHECKLIST = STORED_CATEGORY_IDS.join(", ");

function buildUserPrompt(wordsMin: number, wordsMax: number): string {
  return `Generate between ${wordsMin} and ${wordsMax} objects (inclusive) inside "entries". Return only the JSON object {"entries":[...]} with no other keys.

Hard requirement: include at least one entry for EVERY category slug: ${CATEGORY_CHECKLIST}. If any slug is missing, the batch is invalid.`;
}

function formatParseFailureMessage(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues.map((e) => e.message ?? String(e.code)).join("; ");
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export async function generateWordsBatch(
  options: GenerateWordsOptions,
): Promise<LlmWordsBatch> {
  const {
    apiKey,
    model = "ministral-3b-2512",
    wordsMin = 30,
    wordsMax = 50,
  } = options;

  const min = Math.max(1, Math.min(wordsMin, wordsMax));
  const max = Math.max(min, wordsMax);

  const system = SYSTEM_PROMPT.replace(/MIN_COUNT/g, String(min)).replace(
    /MAX_COUNT/g,
    String(max),
  );

  const initialMessages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: buildUserPrompt(min, max) },
  ];

  const baseBody = {
    model,
    messages: initialMessages,
    temperature: 0.75,
  };

  const MAX_PARSE_ATTEMPTS = 4;
  let messages: MistralChatMessage[] = [...initialMessages];

  for (let attempt = 0; attempt < MAX_PARSE_ATTEMPTS; attempt++) {
    const useJsonObject = attempt === 0;
    let res = await fetch(MISTRAL_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...baseBody,
        messages,
        ...(useJsonObject ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (res.status === 400) {
      const errText = await res.text();
      if (useJsonObject && /response_format|json_object/i.test(errText)) {
        res = await fetch(MISTRAL_CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ ...baseBody, messages }),
        });
      } else {
        throw new Error(`Mistral API 400: ${errText.slice(0, 500)}`);
      }
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Mistral API ${res.status}: ${errText.slice(0, 500)}`);
    }
    const body = (await res.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Mistral response missing message content");
    }

    try {
      return parseLlmWordsJson(content);
    } catch (err) {
      const detail = formatParseFailureMessage(err);
      if (attempt === MAX_PARSE_ATTEMPTS - 1) {
        throw new Error(
          `Word batch validation failed after ${MAX_PARSE_ATTEMPTS} attempts: ${detail}`,
        );
      }
      messages = [
        ...messages,
        { role: "assistant" as const, content },
        {
          role: "user" as const,
          content: `Your JSON failed validation: ${detail}

Regenerate the FULL batch only: a single JSON object {"entries":[...]} with between ${min} and ${max} items (inclusive). No markdown, no explanation.

Every slug must appear at least once: ${CATEGORY_CHECKLIST}. Fix duplicates, invalid categories, hint format, and entry count as needed.`,
        },
      ];
    }
  }

  throw new Error("Word batch generation exhausted retries");
}
