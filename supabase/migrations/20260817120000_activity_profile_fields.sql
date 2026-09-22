-- Adds the full onboarding profile (grade, GPA range, gender, race, age,
-- interests, location, remote preference, travel willingness, format
-- preference) to activity_events so the admin tracker shows a rich profile
-- per person, not just name/school. Columns are populated on every future
-- event from the user's current UserContext state; existing rows stay null.

alter table public.activity_events
  add column if not exists user_grade text,
  add column if not exists user_gpa_range text,
  add column if not exists user_gender text,
  add column if not exists user_race text,
  add column if not exists user_age integer,
  add column if not exists user_interests text,
  add column if not exists user_location text,
  add column if not exists user_state text,
  add column if not exists user_city text,
  add column if not exists user_remote_only boolean,
  add column if not exists user_travel_willingness text,
  add column if not exists user_format_preference text;

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
          max(user_grade) filter (where user_grade is not null and user_grade <> '') as user_grade,
          max(user_gpa_range) filter (where user_gpa_range is not null and user_gpa_range <> '') as user_gpa_range,
          max(user_gender) filter (where user_gender is not null and user_gender <> '') as user_gender,
          max(user_race) filter (where user_race is not null and user_race <> '') as user_race,
          max(user_age) as user_age,
          max(user_interests) filter (where user_interests is not null and user_interests <> '') as user_interests,
          max(user_location) filter (where user_location is not null and user_location <> '') as user_location,
          max(user_state) filter (where user_state is not null and user_state <> '') as user_state,
          max(user_city) filter (where user_city is not null and user_city <> '') as user_city,
          bool_or(user_remote_only) as user_remote_only,
          max(user_travel_willingness) filter (where user_travel_willingness is not null and user_travel_willingness <> '') as user_travel_willingness,
          max(user_format_preference) filter (where user_format_preference is not null and user_format_preference <> '') as user_format_preference,
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
