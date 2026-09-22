-- Fuzzy, abbreviation-aware school search for the onboarding autocomplete.
--
-- Problem: NCES CCD stores many school names abbreviated ("TOMPKINS H S"
-- instead of "Obra D. Tompkins High School"). The client's token-AND ilike
-- search fails the moment a student types "high school", a name part NCES
-- omits ("Obra D"), or a misspelling ("Thompson" for "Tompkins").
--
-- Fix: a normalized search_name column (abbreviations expanded, punctuation
-- stripped) plus a search_schools() RPC that scores each row per query token:
-- substring match = 1.0, soundex match (catches misspellings) = 0.7, and the
-- school's city is included in the haystack so "tompkins katy" works too.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists fuzzystrmatch with schema extensions;

-- Lowercase, strip punctuation, expand NCES abbreviations, collapse spaces.
create or replace function public.school_search_norm(txt text)
returns text
language sql
immutable
parallel safe
set search_path = public, extensions
as $$
  select trim(regexp_replace(
           regexp_replace(
             regexp_replace(
               regexp_replace(
                 regexp_replace(lower(coalesce(txt, '')), '[^a-z0-9]+', ' ', 'g'),
                 '\y(h\s*s)\y', 'high school', 'g'),
               '\y(j\s*h)\y', 'junior high', 'g'),
             '\y(sch|schl)\y', 'school', 'g'),
           '\s+', ' ', 'g'))
$$;

alter table public.schools add column if not exists search_name text;

update public.schools
set search_name = public.school_search_norm(name)
where search_name is distinct from public.school_search_norm(name);

create or replace function public.schools_set_search_name()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.search_name := public.school_search_norm(new.name);
  return new;
end
$$;

drop trigger if exists trg_schools_search_name on public.schools;
create trigger trg_schools_search_name
before insert or update of name on public.schools
for each row execute function public.schools_set_search_name();

create index if not exists schools_search_name_trgm
  on public.schools using gin (search_name extensions.gin_trgm_ops);

-- Ranked fuzzy search. Generic words ("high", "school") and single letters
-- ("d" in "Obra D") are dropped from the query; each remaining token must
-- match somewhere (best token score >= 0.7), rows ordered by average token
-- score then trigram similarity to the full query.
create or replace function public.search_schools(
  q            text,
  state_filter text default null,
  max_rows     int  default 8
)
returns table (id text, name text, city text, state text, district text)
language plpgsql
stable
parallel safe
set search_path = public, extensions
as $$
declare
  nq   text;
  toks text[];
begin
  nq := public.school_search_norm(q);
  if length(nq) < 2 then
    return;
  end if;

  select coalesce(array_agg(t), '{}'::text[]) into toks
  from unnest(string_to_array(nq, ' ')) as t
  where length(t) > 1
    and t not in ('high', 'school', 'the', 'of', 'at', 'and', 'for');

  -- Query was only generic words: plain substring on the normalized name.
  if coalesce(array_length(toks, 1), 0) = 0 then
    return query
      select s.id, s.name, s.city, s.state, s.district
      from public.schools s
      where s.search_name like '%' || nq || '%'
        and (state_filter is null or s.state = state_filter)
      order by s.name
      limit max_rows;
    return;
  end if;

  return query
  select s.id, s.name, s.city, s.state, s.district
  from public.schools s
  cross join lateral (
    select s.search_name || ' ' || lower(coalesce(s.city, '')) as h
  ) hay
  cross join lateral (
    select avg(tok.score) as avg_score, max(tok.score) as best_score
    from unnest(toks) as t
    cross join lateral (
      select case
        when hay.h like '%' || t || '%' then 1.0
        when exists (
          select 1 from unnest(string_to_array(hay.h, ' ')) as w
          where soundex(w) = soundex(t)
        ) then 0.7
        else 0.0
      end as score
    ) tok
  ) sc
  where (state_filter is null or s.state = state_filter)
    and sc.best_score >= 0.7
  order by sc.avg_score desc, similarity(s.search_name, nq) desc, s.name
  limit max_rows;
end
$$;

grant execute on function public.search_schools(text, text, int) to anon, authenticated;
