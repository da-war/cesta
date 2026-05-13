-- =====================================================================
-- CESTA — Production Schema
-- Includes: GDPR/CCPA-compliant account deletion, consent tracking,
-- audit logging, all gamification & content tables.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  cefr_level text not null default 'A1.0'
    check (cefr_level in ('A1.0','A1.1','A1.2','A2.0','A2.1','A2.2','B1.0','B1.1','B1.2')),
  cefr_band text generated always as (substr(cefr_level, 1, 2)) stored,
  xp int not null default 0,
  streak_days int not null default 0,
  longest_streak int not null default 0,
  last_active_date date,
  daily_goal_xp int not null default 30,
  league text not null default 'bronze'
    check (league in ('bronze','silver','gold','emerald','sapphire','diamond')),
  league_xp_week int not null default 0,
  hearts int not null default 5 check (hearts between 0 and 5),
  hearts_refill_at timestamptz,
  is_pro boolean not null default false,
  entitlement_expires_at timestamptz,
  timezone text not null default 'UTC',
  has_completed_placement boolean not null default false,
  has_completed_onboarding boolean not null default false,
  notif_streak_enabled boolean not null default true,
  notif_morning_enabled boolean not null default true,
  notif_afternoon_enabled boolean not null default true,
  notif_evening_enabled boolean not null default true,
  push_token text,
  age_confirmed boolean not null default false,
  marketing_consent boolean not null default false,
  analytics_consent boolean not null default false,
  tracking_consent boolean not null default false,
  consent_recorded_at timestamptz,
  terms_accepted_version text,
  terms_accepted_at timestamptz,
  privacy_accepted_version text,
  privacy_accepted_at timestamptz,
  deletion_requested_at timestamptz,
  deletion_scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_cefr_band_idx on public.profiles(cefr_band);
create index profiles_deletion_idx on public.profiles(deletion_scheduled_for)
  where deletion_scheduled_for is not null;

-- Auto-create profile when new auth user is inserted
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- CONSENT AUDIT LOG (immutable) ----------
create table public.consent_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  consent_type text not null check (consent_type in
    ('terms','privacy','marketing','analytics','tracking','age')),
  granted boolean not null,
  version text,
  ip_address text,
  user_agent text,
  recorded_at timestamptz not null default now()
);

create index consent_log_user_idx on public.consent_log(user_id, recorded_at desc);

-- ---------- CONTENT ----------
create table public.units (
  id text primary key,
  region text not null check (region in ('A1','A2','B1')),
  region_name text not null,
  display_order int not null,
  title text not null,
  description text,
  is_boss boolean not null default false,
  required_xp int not null default 0,
  cefr_sub_band text not null
);

create index units_region_idx on public.units(region, display_order);

create table public.lessons (
  id text primary key,
  unit_id text not null references public.units(id) on delete cascade,
  display_order int not null,
  title text not null,
  target_xp int not null default 10,
  is_free boolean not null default false
);

create index lessons_unit_idx on public.lessons(unit_id, display_order);

create table public.words (
  id text primary key,
  cs text not null,
  en text not null,
  ipa text,
  audio_path text,
  pos text,
  gender text check (gender in ('m','f','n','ma','mi') or gender is null),
  cefr text not null,
  frequency_rank int,
  notes text,
  example_cs text,
  example_en text
);

create index words_cefr_idx on public.words(cefr);
create index words_frequency_idx on public.words(frequency_rank);

create table public.lesson_items (
  lesson_id text references public.lessons(id) on delete cascade,
  word_id text references public.words(id) on delete cascade,
  display_order int not null,
  exercise_types text[] not null default array['flashcard','tap_match','listen','type'],
  primary key (lesson_id, word_id)
);

create index lesson_items_lesson_idx on public.lesson_items(lesson_id, display_order);

create table public.distractors (
  word_id text references public.words(id) on delete cascade,
  wrong_en text not null,
  primary key (word_id, wrong_en)
);

create table public.placement_questions (
  id text primary key,
  cefr_target text not null,
  skill text not null check (skill in ('vocab','grammar','listening')),
  prompt_cs text,
  prompt_en text,
  audio_path text,
  correct_answer text not null,
  choices text[] not null
);

create index placement_questions_cefr_idx on public.placement_questions(cefr_target);

-- ---------- USER DATA ----------
create table public.user_lesson_progress (
  user_id uuid references auth.users(id) on delete cascade,
  lesson_id text references public.lessons(id) on delete cascade,
  stars int not null default 0 check (stars between 0 and 3),
  best_accuracy numeric(4,3),
  completed_at timestamptz,
  attempts int not null default 0,
  primary key (user_id, lesson_id)
);

create index user_lesson_progress_user_idx on public.user_lesson_progress(user_id);

create table public.user_word_srs (
  user_id uuid references auth.users(id) on delete cascade,
  word_id text references public.words(id) on delete cascade,
  ease numeric(3,2) not null default 2.5 check (ease between 1.3 and 2.8),
  interval_days numeric(6,2) not null default 0,
  reps int not null default 0,
  lapses int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  primary key (user_id, word_id)
);

create index user_word_srs_due_idx on public.user_word_srs(user_id, due_at);

create table public.user_daily_activity (
  user_id uuid references auth.users(id) on delete cascade,
  activity_date date not null,
  xp_earned int not null default 0,
  lessons_completed int not null default 0,
  goal_met boolean not null default false,
  primary key (user_id, activity_date)
);

create index user_daily_activity_user_idx on public.user_daily_activity(user_id, activity_date desc);

-- Streak trigger
create or replace function public.update_streak_on_goal_met()
returns trigger language plpgsql as $$
declare
  prev_date date;
  current_streak int;
begin
  if new.goal_met = true and (old.goal_met is null or old.goal_met = false) then
    select last_active_date, streak_days into prev_date, current_streak
      from public.profiles where id = new.user_id;
    if prev_date is null then
      current_streak := 1;
    elsif prev_date = new.activity_date - interval '1 day' then
      current_streak := current_streak + 1;
    elsif prev_date = new.activity_date then
      return new;
    else
      current_streak := 1;
    end if;
    update public.profiles
      set streak_days = current_streak,
          longest_streak = greatest(longest_streak, current_streak),
          last_active_date = new.activity_date
      where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger user_daily_activity_streak after insert or update on public.user_daily_activity
  for each row execute function public.update_streak_on_goal_met();

-- ---------- LEAGUES ----------
create table public.league_cohorts (
  id uuid primary key default uuid_generate_v4(),
  league text not null,
  cefr_band text not null,
  week_start date not null,
  created_at timestamptz not null default now()
);

create table public.user_cohort_membership (
  user_id uuid references auth.users(id) on delete cascade,
  cohort_id uuid references public.league_cohorts(id) on delete cascade,
  week_start date not null,
  xp_in_cohort int not null default 0,
  primary key (user_id, week_start)
);

create index user_cohort_xp_idx on public.user_cohort_membership(cohort_id, xp_in_cohort desc);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.consent_log enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.user_word_srs enable row level security;
alter table public.user_daily_activity enable row level security;
alter table public.user_cohort_membership enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.words enable row level security;
alter table public.lesson_items enable row level security;
alter table public.distractors enable row level security;
alter table public.placement_questions enable row level security;
alter table public.league_cohorts enable row level security;

create policy "own_profile_select" on public.profiles for select using (auth.uid() = id);
create policy "own_profile_update" on public.profiles for update using (auth.uid() = id);

create policy "own_consent_select" on public.consent_log for select using (auth.uid() = user_id);
create policy "own_consent_insert" on public.consent_log for insert with check (auth.uid() = user_id);

create policy "own_lesson_progress_all" on public.user_lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_srs_all" on public.user_word_srs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_activity_all" on public.user_daily_activity
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cohort_leaderboard" on public.user_cohort_membership
  for select using (
    cohort_id in (select cohort_id from public.user_cohort_membership where user_id = auth.uid())
  );

create policy "units_public_read" on public.units for select using (true);
create policy "lessons_public_read" on public.lessons for select using (true);
create policy "words_public_read" on public.words for select using (true);
create policy "lesson_items_public_read" on public.lesson_items for select using (true);
create policy "distractors_public_read" on public.distractors for select using (true);
create policy "placement_questions_public_read" on public.placement_questions for select using (true);
create policy "league_cohorts_public_read" on public.league_cohorts for select using (true);

-- =====================================================================
-- RPCs
-- =====================================================================

create or replace function public.award_xp(p_xp int, p_lesson_id text default null, p_perfect boolean default false)
returns void language plpgsql security definer as $$
declare
  v_user uuid := auth.uid();
  v_today date;
  v_tz text;
  v_goal int;
  v_xp_today int;
  v_goal_met boolean;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  select timezone, daily_goal_xp into v_tz, v_goal from public.profiles where id = v_user;
  v_today := (now() at time zone coalesce(v_tz, 'UTC'))::date;
  update public.profiles
    set xp = xp + p_xp, league_xp_week = league_xp_week + p_xp where id = v_user;
  insert into public.user_daily_activity (user_id, activity_date, xp_earned, lessons_completed)
    values (v_user, v_today, p_xp, case when p_lesson_id is not null then 1 else 0 end)
    on conflict (user_id, activity_date) do update
      set xp_earned = public.user_daily_activity.xp_earned + p_xp,
          lessons_completed = public.user_daily_activity.lessons_completed
            + case when p_lesson_id is not null then 1 else 0 end;
  select xp_earned, goal_met into v_xp_today, v_goal_met
    from public.user_daily_activity where user_id = v_user and activity_date = v_today;
  if v_xp_today >= v_goal and v_goal_met = false then
    update public.user_daily_activity set goal_met = true
      where user_id = v_user and activity_date = v_today;
  end if;
end;
$$;

grant execute on function public.award_xp(int, text, boolean) to authenticated;

create or replace function public.complete_lesson(p_lesson_id text, p_stars int, p_accuracy numeric)
returns void language plpgsql security definer as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  insert into public.user_lesson_progress (user_id, lesson_id, stars, best_accuracy, completed_at, attempts)
    values (v_user, p_lesson_id, p_stars, p_accuracy, now(), 1)
    on conflict (user_id, lesson_id) do update
      set stars = greatest(public.user_lesson_progress.stars, p_stars),
          best_accuracy = greatest(coalesce(public.user_lesson_progress.best_accuracy, 0), p_accuracy),
          completed_at = coalesce(public.user_lesson_progress.completed_at, now()),
          attempts = public.user_lesson_progress.attempts + 1;
end;
$$;

grant execute on function public.complete_lesson(text, int, numeric) to authenticated;

create or replace function public.lose_heart()
returns int language plpgsql security definer as $$
declare v_user uuid := auth.uid(); v_hearts int;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  update public.profiles
    set hearts = greatest(hearts - 1, 0),
        hearts_refill_at = case when hearts = 5 then now() + interval '4 hours' else hearts_refill_at end
    where id = v_user returning hearts into v_hearts;
  return v_hearts;
end;
$$;

grant execute on function public.lose_heart() to authenticated;

create or replace function public.maybe_refill_hearts()
returns int language plpgsql security definer as $$
declare v_user uuid := auth.uid(); v_hearts int;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  update public.profiles
    set hearts = 5, hearts_refill_at = null
    where id = v_user and hearts < 5 and hearts_refill_at is not null and hearts_refill_at <= now()
    returning hearts into v_hearts;
  if v_hearts is null then
    select hearts into v_hearts from public.profiles where id = v_user;
  end if;
  return v_hearts;
end;
$$;

grant execute on function public.maybe_refill_hearts() to authenticated;

create or replace function public.set_cefr_level(p_level text)
returns void language plpgsql security definer as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_level not in ('A1.0','A1.1','A1.2','A2.0','A2.1','A2.2','B1.0','B1.1','B1.2') then
    raise exception 'Invalid CEFR level';
  end if;
  update public.profiles set cefr_level = p_level, has_completed_placement = true where id = v_user;
end;
$$;

grant execute on function public.set_cefr_level(text) to authenticated;

-- ---------- ACCOUNT DELETION (Apple/Google requirement) ----------
create or replace function public.request_account_deletion()
returns void language plpgsql security definer as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  update public.profiles
    set deletion_requested_at = now(),
        deletion_scheduled_for = now() + interval '30 days'
    where id = v_user;
end;
$$;

grant execute on function public.request_account_deletion() to authenticated;

create or replace function public.cancel_account_deletion()
returns void language plpgsql security definer as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  update public.profiles
    set deletion_requested_at = null, deletion_scheduled_for = null
    where id = v_user;
end;
$$;

grant execute on function public.cancel_account_deletion() to authenticated;

-- Immediate deletion - removes all user data cascade via FK
create or replace function public.delete_my_account_now()
returns void language plpgsql security definer as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  -- Cascade removes everything from public schema
  delete from auth.users where id = v_user;
end;
$$;

grant execute on function public.delete_my_account_now() to authenticated;

-- ---------- DATA EXPORT (GDPR right to access) ----------
create or replace function public.export_my_data()
returns jsonb language plpgsql security definer as $$
declare
  v_user uuid := auth.uid();
  v_data jsonb;
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = v_user),
    'lesson_progress', (select coalesce(jsonb_agg(to_jsonb(lp)), '[]'::jsonb)
                        from public.user_lesson_progress lp where lp.user_id = v_user),
    'word_srs', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
                 from public.user_word_srs s where s.user_id = v_user),
    'daily_activity', (select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
                       from public.user_daily_activity a where a.user_id = v_user),
    'consent_log', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
                    from public.consent_log c where c.user_id = v_user),
    'exported_at', now()
  ) into v_data;
  return v_data;
end;
$$;

grant execute on function public.export_my_data() to authenticated;

-- ---------- CONSENT RECORDING ----------
create or replace function public.record_consent(
  p_type text, p_granted boolean, p_version text default null
) returns void language plpgsql security definer as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  insert into public.consent_log (user_id, consent_type, granted, version)
    values (v_user, p_type, p_granted, p_version);
  if p_type = 'terms' then
    update public.profiles set terms_accepted_version = p_version, terms_accepted_at = now() where id = v_user;
  elsif p_type = 'privacy' then
    update public.profiles set privacy_accepted_version = p_version, privacy_accepted_at = now() where id = v_user;
  elsif p_type = 'marketing' then
    update public.profiles set marketing_consent = p_granted, consent_recorded_at = now() where id = v_user;
  elsif p_type = 'analytics' then
    update public.profiles set analytics_consent = p_granted, consent_recorded_at = now() where id = v_user;
  elsif p_type = 'tracking' then
    update public.profiles set tracking_consent = p_granted, consent_recorded_at = now() where id = v_user;
  elsif p_type = 'age' then
    update public.profiles set age_confirmed = p_granted, consent_recorded_at = now() where id = v_user;
  end if;
end;
$$;

grant execute on function public.record_consent(text, boolean, text) to authenticated;
