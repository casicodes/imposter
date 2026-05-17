# Imposter

**[drinknplay.vercel.app](https://drinknplay.vercel.app/)** — pass-the-phone party game: everyone gets the same secret word and a hint, except one imposter who only sees the hint. Configure player count, category, and hint difficulty, then play in person.

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
| `npm run export-offline-words` | Pull recent rows from `game_words` into [`lib/offline-words-snapshot.json`](lib/offline-words-snapshot.json) (Supabase env vars; optional `OFFLINE_EXPORT_TARGET`, default ~130). Retries on transient `fetch failed`. If Node still cannot reach Supabase (VPN, paused project, etc.), export rows from the Supabase SQL editor as JSON and run `npm run export-offline-words -- --from-file ./export.json` (array of `category`, `word`, `hint_easy`, `hint_medium`, `hint_hard`). |

### Export snapshot without CLI → Supabase (JSON file)

1. In **Supabase → SQL → New query**, run (returns **one cell** that is a full JSON array — easy to copy):

```sql
select coalesce(json_agg(row), '[]'::json)
from (
  select category, word, hint_easy, hint_medium, hint_hard
  from public.game_words
  order by created_at desc
  limit 500
) row;
```

2. Copy the result, save as e.g. `game-words.json` in the **project root** (same folder as `package.json`).

3. Run: `npm run export-offline-words -- --from-file ./game-words.json`

To verify the script only: `cp scripts/sample-game-words-for-export.json game-words.json` then the same command.

## Deploy

Designed for [Vercel](https://vercel.com); set the same environment variables as in production. Point your domain or use the default `*.vercel.app` URL.
