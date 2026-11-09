-- Global rate limits on anonymous inserts, so a script cannot flood the public board.
--
-- There is no sign-in and we do not store IP addresses, so the limits are global per table:
-- an abuser can block new submissions for a few minutes, but cannot fill the board with junk.
-- Inserts made as postgres or service_role (seeds, sweeps, maintainers) are never limited.
-- The error uses SQLSTATE PT429, which PostgREST returns as HTTP 429.

create or replace function public.limit_public_inserts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  per_10_min int;
  per_day    int;
  recent     int;
  today      int;
begin
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_table_name = 'offers' then
    per_10_min := 10; per_day := 60;
    select count(*) filter (where created_at > now() - interval '10 minutes'),
           count(*) filter (where created_at > now() - interval '1 day')
      into recent, today
      from public.offers
     where source_type = 'user_submitted' and created_at > now() - interval '1 day';
  elsif tg_table_name = 'offer_reports' then
    per_10_min := 30; per_day := 300;
    select count(*) filter (where created_at > now() - interval '10 minutes'),
           count(*) filter (where created_at > now() - interval '1 day')
      into recent, today
      from public.offer_reports
     where created_at > now() - interval '1 day';
  elsif tg_table_name = 'contact_requests' then
    per_10_min := 10; per_day := 60;
    select count(*) filter (where created_at > now() - interval '10 minutes'),
           count(*) filter (where created_at > now() - interval '1 day')
      into recent, today
      from public.contact_requests
     where created_at > now() - interval '1 day';
  else
    return new;
  end if;

  if recent >= per_10_min or today >= per_day then
    raise exception 'Too many submissions right now. Try again later.'
      using errcode = 'PT429';
  end if;
  return new;
end;
$$;

revoke all on function public.limit_public_inserts() from public, anon, authenticated;

create trigger offers_rate_limit before insert on public.offers
for each row execute function public.limit_public_inserts();

create trigger offer_reports_rate_limit before insert on public.offer_reports
for each row execute function public.limit_public_inserts();

create trigger contact_requests_rate_limit before insert on public.contact_requests
for each row execute function public.limit_public_inserts();

create index if not exists offers_user_submitted_created_idx
  on public.offers (created_at) where source_type = 'user_submitted';
create index if not exists offer_reports_created_idx on public.offer_reports (created_at);
