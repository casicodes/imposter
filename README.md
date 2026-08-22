# Imposter

**[drinknplay.vercel.app](https://drinknplay.vercel.app/)** — pass-the-phone party game: everyone gets the same secret word and a hint, except one imposter who only sees the hint. Configure player count, category, hint difficulty, and optionally **Nepali words** (Devanagari secrets with simple English hints, e.g. मकै → corn), then play in person.

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion. Game words live in **Supabase**; optional **Mistral** + cron can batch-generate new entries via internal APIs (see `.env.example`).

## Local development

```bash
npm install
cp .env.example .env.local
```

Fill `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (apply `supabase/migrations/20250402000000_game_words.sql` in the Supabase SQL editor). Other variables in `.env.example` are only needed for word ingestion or cron.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run generate-words` | Generate words with Mistral and insert into Supabase (needs `MISTRAL_API_KEY`) |
| `npm run export-offline-words` | Pull recent rows from `game_words` into [`lib/offline-words-snapshot.json`](lib/offline-words-snapshot.json). Defaults: **~500** words, **half** to `everyday`, the rest split evenly across the other six categories. Env: `OFFLINE_EXPORT_TARGET` (default 500), `OFFLINE_EXPORT_EVERYDAY_FRACTION` (default `0.5`), `OFFLINE_EXPORT_FETCH_LIMIT` (default 6000). Retries on transient `fetch failed`. If Node cannot reach Supabase, export JSON from SQL (see below) and run `npm run export-offline-words -- --from-file ./export.json`. |

### Export snapshot without CLI → Supabase (JSON file)

1. In **Supabase → SQL → New query**, run (returns **one cell** that is a full JSON array — easy to copy):

```sql
select coalesce(json_agg(row), '[]'::json)
from (
  select category, word, hint_easy, hint_medium, hint_hard
  from public.game_words
  order by created_at desc
  limit 6000
) row;
```

2. Copy the result, save as e.g. `game-words.json` in the **project root** (same folder as `package.json`).

3. Run: `npm run export-offline-words -- --from-file ./game-words.json`

To verify the script only: `cp scripts/sample-game-words-for-export.json game-words.json` then the same command.

Snapshot sizing: defaults target **500** words with **half** reserved for `everyday` (then the rest split evenly across the other six categories), then the script **fills any leftover slots** until it hits 500 or runs out of rows. Rows are deduped per category by **word + all three hints** (same word with different hints counts as multiple entries). If a category runs out of unique rows, that category’s share is capped and others absorb the budget.

## Deploy

Designed for [Vercel](https://vercel.com); set the same environment variables as in production. Point your domain or use the default `*.vercel.app` URL.
