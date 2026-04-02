-- Run in Supabase SQL editor or via supabase db push

create table if not exists public.game_words (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in (
      'food',
      'movies',
      'animals',
      'places',
      'sports',
      'science',
      'everyday'
    )
  ),
  word text not null,
  hint_easy text not null,
  hint_medium text not null,
  hint_hard text not null,
  created_at timestamptz not null default now(),
  batch_id uuid,
  source text not null default 'llm'
);

create index if not exists game_words_category_idx on public.game_words (category);

alter table public.game_words enable row level security;

-- No policies: anon/authenticated cannot read; service role bypasses RLS.

create or replace function public.random_game_word(p_category text)
returns setof public.game_words
language sql
stable
as $$
  select *
  from public.game_words
  where (p_category = 'mix' or category = p_category)
  order by random()
  limit 1;
$$;

revoke all on function public.random_game_word(text) from public;
grant execute on function public.random_game_word(text) to service_role;
