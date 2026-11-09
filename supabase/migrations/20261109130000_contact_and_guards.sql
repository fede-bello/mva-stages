-- Contact requests (corrections, takedowns, personal data) and a personal-email guard on
-- public offer inserts.
--
-- Access model
--   * Anyone can send a contact request. Nobody can read them with the publishable key:
--     maintainers read them with the service role. There are no select, update or delete
--     policies on purpose.
--   * Public offer inserts that contain a personal email address are rejected. Role addresses
--     (jobs@, recrutement@, internships@...) are allowed, same rule as scripts/build_seed.py.

-- Contact requests --------------------------------------------------------------

create table public.contact_requests (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('remove', 'correct', 'personal_data', 'other')),
  offer_url    text check (offer_url is null or (offer_url ~* '^https?://' and char_length(offer_url) <= 2000)),
  message      text not null check (char_length(message) between 1 and 2000),
  reply_email  text check (reply_email is null or (char_length(reply_email) <= 200 and reply_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  created_at   timestamptz not null default now(),
  resolved     boolean not null default false
);

create index contact_requests_open_idx on public.contact_requests (created_at) where not resolved;

alter table public.contact_requests enable row level security;

create policy "anyone sends contact requests" on public.contact_requests
  for insert to anon, authenticated with check (not resolved);

-- Public inserts cannot backdate or pre-resolve a request.
create or replace function public.guard_public_contact()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
    return new;
  end if;
  new.created_at := now();
  new.resolved   := false;
  return new;
end;
$$;

create trigger contact_requests_guard before insert on public.contact_requests
for each row execute function public.guard_public_contact();

-- Personal email guard on public offer inserts ------------------------------------

create or replace function public.has_personal_email(t text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_or(
    lower(split_part(m[1], '@', 1)) !~ (
      '^(jobs?|careers?|recrut\w*|recruit\w*|recruiting|hiring|talents?|rh|hr|stages?|internships?|'
      || 'interns?|apply|applications?|candidat\w*|contact|info|admin|secretariat\w*|'
      || '[\w-]*-?recrut\w*|[\w-]*-?recruit\w*|[\w-]*-?jobs|[\w-]*-?stages?|[\w-]*-?internships?|predoc|'
      || 'philab|trainees?|[\w-]*-trainees)$'
    )
  ), false)
  from regexp_matches(coalesce(t, ''), '([A-Za-z0-9_.+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+)', 'g') as m;
$$;

create or replace function public.guard_public_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
    return new;
  end if;
  if public.has_personal_email(concat_ws(' ',
       new.organization, new.title, new.title_en, new.city, new.country, new.stipend_text,
       new.start_text, new.duration_text, new.requirements, new.reference, new.apply_url,
       new.apply_contact, new.ats, new.source_url, new.description, new.notes)) then
    raise exception 'Personal email addresses are not allowed. Only role addresses like jobs@ can be published.'
      using errcode = '22023';
  end if;
  new.slug           := gen_random_uuid()::text;
  new.verified       := false;
  new.source_type    := 'user_submitted';
  new.status         := case when new.status in ('open', 'unknown') then new.status else 'unknown' end;
  new.status_checked := current_date;
  new.first_seen     := current_date;
  new.created_at     := now();
  new.updated_at     := now();
  return new;
end;
$$;
