-- Notifies the admin by email (via the notify-essay-submission edge
-- function) whenever a new essay is submitted for review, so a human can
-- actually see and respond to it. Without this, essay_reviews was a
-- write-only table nobody was watching.
--
-- BEFORE RUNNING THIS MIGRATION:
--   1. Deploy the notify-essay-submission edge function and set its secrets
--      (see that function's file header for the full list).
--   2. Replace REPLACE_WITH_YOUR_NOTIFY_WEBHOOK_SECRET below with the exact
--      same value you set as NOTIFY_WEBHOOK_SECRET on that function.
--   3. Replace the project URL below if this project's Supabase URL differs
--      from xneqyrgpnqyczlklunzz.supabase.co.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_essay_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://xneqyrgpnqyczlklunzz.supabase.co/functions/v1/notify-essay-submission',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-secret', 'REPLACE_WITH_YOUR_NOTIFY_WEBHOOK_SECRET'
    ),
    body := jsonb_build_object(
      'email', new.email,
      'essay_title', new.essay_title,
      'essay_text', new.essay_text,
      'program', new.program,
      'notes', new.notes
    )
  );
  return new;
end;
$$;

drop trigger if exists essay_review_notify on public.essay_reviews;
create trigger essay_review_notify
  after insert on public.essay_reviews
  for each row execute function public.notify_essay_submission();
