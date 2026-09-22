-- Adds an 'onboarding' event type + referral_source column to activity_events
-- so we can see how users found Interny (asked during onboarding), and
-- surfaces a breakdown of it in admin_get_activity_stats.

alter table public.activity_events
  add column if not exists referral_source text;

alter table public.activity_events
  drop constraint if exists activity_events_event_type_check;

alter table public.activity_events
  add constraint activity_events_event_type_check
  check (event_type in ('view', 'save', 'apply_click', 'onboarding'));

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
          max(referral_source) filter (where referral_source is not null and referral_source <> '') as referral_source,
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
    ),
    'by_referral_source', (
      select coalesce(json_agg(row_to_json(r)), '[]'::json)
      from (
        select
          referral_source,
          count(distinct device_id) as people
        from activity_events
        where event_type = 'onboarding' and referral_source is not null
        group by referral_source
        order by count(distinct device_id) desc
      ) r
    )
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_get_activity_stats(text) to anon, authenticated;
