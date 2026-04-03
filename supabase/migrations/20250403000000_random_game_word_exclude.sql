-- Exclude already-seen words (normalized) when sampling. Second arg optional at call site.

drop function if exists public.random_game_word(text);

create or replace function public.random_game_word(
  p_category text,
  p_exclude text[] default '{}'
)
returns setof public.game_words
language sql
stable
as $$
  select *
  from public.game_words
  where (p_category = 'mix' or category = p_category)
    and (
      coalesce(array_length(p_exclude, 1), 0) = 0
      or lower(trim(word)) not in (
        select lower(trim(x))
        from unnest(p_exclude) as x
        where length(trim(x)) > 0
      )
    )
  order by random()
  limit 1;
$$;

revoke all on function public.random_game_word(text, text[]) from public;
grant execute on function public.random_game_word(text, text[]) to service_role;
