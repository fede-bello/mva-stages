-- `updated_at` should mean "the offer really changed", so the board can show "Updated" badges and
-- filter by "modified since".
--
-- Before: the touch trigger bumped updated_at on every UPDATE. A sweep upserts every offer, and an
-- upsert that rewrites identical values (or only refreshes status_checked after a re-check) still
-- fires the trigger, so every row looked modified after every load.
-- Now: updated_at moves only when a column other than status_checked, verified and updated_at
-- changes (a maintainer verifying an offer is not news for students).
-- No column, policy or grant changes: the public already reads updated_at with the other columns.
-- Rows already in the database carry the date of the last load, not of a real change, so they are
-- reset once to first_seen. From here on, updated_at only moves on a real change.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (to_jsonb(new) - 'status_checked' - 'verified' - 'updated_at') is distinct from (to_jsonb(old) - 'status_checked' - 'verified' - 'updated_at') then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;

-- One-off baseline. The trigger is switched off for it, otherwise it would put the old value back.
alter table public.offers disable trigger offers_touch;
update public.offers set updated_at = first_seen::timestamptz;
alter table public.offers enable trigger offers_touch;
