-- Vital Diary Database Migration: Auto-Confirm Users & Disable Email Verification Requirement
-- Automatically confirms email on user creation in auth.users so users can sign up and immediately access their dashboard

create or replace function public.auto_confirm_user()
returns trigger as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := timezone('utc'::text, now());
  end if;
  if new.confirmed_at is null then
    new.confirmed_at := timezone('utc'::text, now());
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger before insert or update on auth.users
drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
  before insert or update on auth.users
  for each row execute function public.auto_confirm_user();

-- Auto-confirm any existing unconfirmed users in auth.users
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, timezone('utc'::text, now())),
    confirmed_at = coalesce(confirmed_at, timezone('utc'::text, now()))
where email_confirmed_at is null;
