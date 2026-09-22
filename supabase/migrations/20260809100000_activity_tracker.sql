-- Activity tracker: logs view / save / apply-click events per device so the
-- admin tracker screen can show engagement stats across all users.
-- Insert is open to the app's anon key (same trust model as essay_reviews);
-- direct SELECT is denied to anon/authenticated, and the only read path is
-- admin_get_activity_stats(), which requires a secret passphrase.

create table if not exists public.activity_events (
  id bigint generated always as identity primary key,
  device_id text not null,
  event_type text not null check (event_type in ('view', 'save', 'apply_click')),
  internship_id text,
  internship_title text,
  company text,
  user_name text,
  user_school text,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_device_id_idx on public.activity_events (device_id);
create index if not exists activity_events_internship_id_idx on public.activity_events (internship_id);
create index if not exists activity_events_created_at_idx on public.activity_events (created_at);

alter table public.activity_events enable row level security;

drop policy if exists "activity_events_insert_anon" on public.activity_events;
create policy "activity_events_insert_anon"
  on public.activity_events
  for insert
  to anon, authenticated
  with check (true);

-- No select policy is created, so anon/authenticated cannot read this table
-- directly; only the security-definer function below can.

create or replace function public.admin_get_activity_stats(p_secret text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if p_secret is distinct from 'interny-admin-k7q2m9x4' then
    raise exception 'unauthorized';
  end if;

  select json_build_object(
    'totals', (
      select json_build_object(
        'people', count(distinct device_id),
        'views', count(*) filter (where event_type = 'view'),
        'saves', count(*) filter (where event_type = 'save'),
        'applies', count(*) filter (where event_type = 'apply_click')
      )
      from activity_events
    ),
    'by_device', (
      select coalesce(json_agg(row_to_json(d)), '[]'::json)
      from (
        select
          device_id,
          max(user_name) filter (where user_name is not null and user_name <> '') as user_name,
          max(user_school) filter (where user_school is not null and user_school <> '') as user_school,
          count(*) filter (where event_type = 'view') as views,
          count(*) filter (where event_type = 'save') as saves,
          count(*) filter (where event_type = 'apply_click') as applies,
          max(created_at) as last_active
        from activity_events
        group by device_id
        order by max(created_at) desc
      ) d
    ),
    'by_listing', (
      select coalesce(json_agg(row_to_json(l)), '[]'::json)
      from (
        select
          internship_id,
          max(internship_title) as internship_title,
          max(company) as company,
          count(*) filter (where event_type = 'view') as views,
          count(*) filter (where event_type = 'save') as saves,
          count(*) filter (where event_type = 'apply_click') as applies
        from activity_events
        where internship_id is not null
        group by internship_id
        order by count(*) desc
        limit 200
      ) l
    )
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_get_activity_stats(text) to anon, authenticated;
