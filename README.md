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

## Deploy

Designed for [Vercel](https://vercel.com); set the same environment variables as in production. Point your domain or use the default `*.vercel.app` URL.
