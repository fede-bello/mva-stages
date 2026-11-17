-- `updated_at` should mean "the offer really changed", so the board can show "Updated" badges and
-- filter by "modified since".
--
-- Before: the touch trigger bumped updated_at on every UPDATE. A sweep upserts every offer, and an
-- upsert that rewrites identical values (or only refreshes status_checked after a re-check) still
-- fires the trigger, so every row looked modified after every load.
-- Now: updated_at moves only when a column other than status_checked and updated_at changes.
-- No column, policy or grant changes: the public already reads updated_at with the other columns.
-- Rows already in the database keep their current updated_at, which up to now is the date of the
-- last load, not of a real change.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (to_jsonb(new) - 'status_checked' - 'updated_at') is distinct from (to_jsonb(old) - 'status_checked' - 'updated_at') then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;
