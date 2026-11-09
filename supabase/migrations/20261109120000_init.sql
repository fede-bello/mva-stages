-- MVA stages board: offers and reports of wrong info.
--
-- Access model (no sign-in)
--   * Anyone can read every offer.
--   * Anyone can add an offer. It is stored unverified, as user_submitted.
--   * Anyone can flag an offer as wrong, closed or duplicate. Only maintainers read the flags.
--   * Editing, verifying and deleting happen with the service role (dashboard or scripts),
--     which bypasses RLS. There are no update or delete policies on purpose.

create extension if not exists pg_trgm;

-- Offers ----------------------------------------------------------------------

create table public.offers (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique default gen_random_uuid()::text,

  organization          text not null check (char_length(organization) between 1 and 200),
  title                 text not null check (char_length(title) between 1 and 300),
  title_en              text check (char_length(title_en) <= 300),
  org_type              text check (org_type in ('company', 'startup', 'big_tech', 'academic_lab', 'public_agency')),

  city                  text check (char_length(city) <= 120),
  country               text check (char_length(country) <= 80),
  work_mode             text not null default 'unknown' check (work_mode in ('onsite', 'hybrid', 'remote', 'unknown')),

  topics                text[] not null default '{}' check (cardinality(topics) <= 5 and topics <@ array[
                          'computer-vision', '3d-vision', 'llm', 'agents', 'nlp', 'rl', 'time-series',
                          'foundation-models', 'generative-models', 'health', 'neuro', 'bio-chem',
                          'robotics', 'earth-observation', 'climate-energy', 'physics-sim',
                          'speech-audio', 'graphs', 'optimization', 'theory', 'recsys-ir',
                          'efficiency', 'other'
                        ]::text[]),

  stipend_text          text check (char_length(stipend_text) <= 200),
  stipend_min_eur_month numeric(8, 2) check (stipend_min_eur_month >= 0),
  stipend_max_eur_month numeric(8, 2) check (stipend_max_eur_month >= stipend_min_eur_month),

  start_text            text check (char_length(start_text) <= 200),
  april_start           text not null default 'unknown' check (april_start in ('yes', 'no', 'flexible', 'unknown')),
  duration_text         text check (char_length(duration_text) <= 120),
  duration_months_min   smallint check (duration_months_min between 1 and 24),
  duration_months_max   smallint check (duration_months_max between 1 and 24),

  posted_date           date,
  deadline              date,
  status                text not null default 'unknown' check (status in ('open', 'closed', 'removed', 'expected', 'unknown')),
  status_checked        date,
  first_seen            date not null default current_date,  -- first sweep or submission that found it

  requirements          text check (char_length(requirements) <= 1000),
  msc_eligible          text not null default 'unknown' check (msc_eligible in ('yes', 'no', 'unknown')),

  reference             text check (char_length(reference) <= 120),
  apply_url             text check (apply_url is null or (apply_url ~* '^https?://' and char_length(apply_url) <= 2000)),
  apply_method          text not null default 'unknown' check (apply_method in ('portal', 'email', 'form', 'spontaneous', 'unknown')),
  ats                   text check (char_length(ats) <= 60),
  apply_contact         text check (char_length(apply_contact) <= 200),

  source_type           text not null default 'user_submitted' check (source_type in (
                          'official_posting', 'mva_drive', 'linkedin', 'aggregator', 'lab_website',
                          'mailing_list', 'user_submitted', 'other'
                        )),
  source_url            text check (source_url is null or (source_url ~* '^https?://' and char_length(source_url) <= 2000)),

  description           text check (char_length(description) <= 2000),
  notes                 text check (char_length(notes) <= 2000),

  verified              boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index offers_status_idx   on public.offers (status);
create index offers_deadline_idx on public.offers (deadline);
create index offers_country_idx  on public.offers (country);
create index offers_topics_idx   on public.offers using gin (topics);
create index offers_search_idx   on public.offers using gin (
  (organization || ' ' || title || ' ' || coalesce(title_en, '') || ' ' || coalesce(city, '')) gin_trgm_ops
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger offers_touch before update on public.offers
for each row execute function public.touch_updated_at();

-- Public submissions cannot pick their own slug, status, provenance or verification.
-- Seeds and sweeps run as postgres or service_role and are trusted.
create or replace function public.guard_public_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') not in ('anon', 'authenticated') then
    return new;
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

create trigger offers_guard before insert on public.offers
for each row execute function public.guard_public_insert();

alter table public.offers enable row level security;

create policy "anyone reads offers" on public.offers
  for select to anon, authenticated using (true);

create policy "anyone adds offers" on public.offers
  for insert to anon, authenticated with check (true);

-- Reports ("this info is wrong") ----------------------------------------------

create table public.offer_reports (
  id          uuid primary key default gen_random_uuid(),
  offer_id    uuid not null references public.offers (id) on delete cascade,
  kind        text not null check (kind in ('closed', 'wrong_info', 'duplicate', 'other')),
  message     text check (char_length(message) <= 2000),
  created_at  timestamptz not null default now(),
  resolved    boolean not null default false
);

create index offer_reports_offer_idx on public.offer_reports (offer_id) where not resolved;

alter table public.offer_reports enable row level security;

create policy "anyone reports" on public.offer_reports
  for insert to anon, authenticated with check (not resolved);

-- Open report counts per offer, readable by everyone, without the messages.
create or replace view public.offer_report_counts
with (security_invoker = false)
as
  select offer_id, count(*)::int as open_reports
  from public.offer_reports
  where not resolved
  group by offer_id;

grant select on public.offer_report_counts to anon, authenticated;
