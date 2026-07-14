-- V1.1 foundation: new, isolated tables only. Do not apply to an unknown or production project.
create extension if not exists pgcrypto;

create type public.v11_app_role as enum (
  'mt_superadmin',
  'municipal_admin',
  'supervisor',
  'brigade_member'
);

create type public.v11_ticket_status as enum (
  'received',
  'assigned',
  'in_progress',
  'pending_verification',
  'resolved'
);

create table public.v11_institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  legal_name text not null check (char_length(legal_name) between 2 and 160),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.v11_institution_settings (
  institution_id uuid primary key references public.v11_institutions(id) on delete restrict,
  public_name text not null check (char_length(public_name) between 2 and 160),
  support_email text,
  support_phone text,
  logo_path text,
  ticket_categories jsonb not null default '[]'::jsonb check (jsonb_typeof(ticket_categories) = 'array'),
  sectors jsonb not null default '[]'::jsonb check (jsonb_typeof(sectors) = 'array'),
  public_content jsonb not null default '{}'::jsonb check (jsonb_typeof(public_content) = 'object'),
  file_policy jsonb not null default '{"max_bytes":5242880,"allowed_mime_types":["image/jpeg","image/png","image/webp"]}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.v11_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 2 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.v11_memberships (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.v11_institutions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.v11_app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, user_id)
);

create table public.v11_brigades (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.v11_institutions(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, name),
  unique (institution_id, id)
);

create table public.v11_brigade_members (
  brigade_id uuid not null references public.v11_brigades(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (brigade_id, user_id)
);

create table public.v11_tickets (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.v11_institutions(id) on delete restrict,
  public_id uuid not null unique default gen_random_uuid(),
  tracking_secret_hash text not null,
  category text not null check (char_length(category) between 2 and 100),
  sector text check (char_length(sector) <= 120),
  location_text text check (char_length(location_text) <= 280),
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  description text not null check (char_length(description) between 5 and 2000),
  status public.v11_ticket_status not null default 'received',
  assigned_brigade_id uuid,
  evidence_path text,
  resolution_evidence_path text,
  resolution_comment text check (char_length(resolution_comment) <= 2000),
  return_reason text check (char_length(return_reason) <= 1000),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  assigned_at timestamptz,
  started_at timestamptz,
  submitted_at timestamptz,
  resolved_at timestamptz,
  updated_at timestamptz not null default now(),
  foreign key (institution_id, assigned_brigade_id)
    references public.v11_brigades(institution_id, id) on delete restrict
);

create index v11_memberships_user_active_idx on public.v11_memberships (user_id, institution_id) where active;
create index v11_tickets_institution_status_idx on public.v11_tickets (institution_id, status, created_at desc);
create index v11_tickets_brigade_status_idx on public.v11_tickets (assigned_brigade_id, status, created_at desc);

create table public.v11_audit_events (
  id bigint generated always as identity primary key,
  institution_id uuid not null references public.v11_institutions(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id uuid not null,
  action text not null check (char_length(action) between 2 and 100),
  before_state jsonb,
  after_state jsonb,
  source text not null default 'web' check (char_length(source) between 2 and 40),
  created_at timestamptz not null default now()
);

create index v11_audit_events_institution_entity_idx
  on public.v11_audit_events (institution_id, entity_type, entity_id, created_at desc);

create or replace function public.v11_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.v11_profiles (user_id, display_name)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 120), ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- This owns only the V1.1 profile bootstrap; role assignment remains an administrative action.
create trigger v11_on_auth_user_created
  after insert on auth.users
  for each row execute function public.v11_handle_new_user();

create or replace function public.v11_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.v11_increment_ticket_version()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  new.version = old.version + 1;
  return new;
end;
$$;

create trigger v11_institutions_updated_at before update on public.v11_institutions
  for each row execute function public.v11_set_updated_at();
create trigger v11_settings_updated_at before update on public.v11_institution_settings
  for each row execute function public.v11_set_updated_at();
create trigger v11_profiles_updated_at before update on public.v11_profiles
  for each row execute function public.v11_set_updated_at();
create trigger v11_memberships_updated_at before update on public.v11_memberships
  for each row execute function public.v11_set_updated_at();
create trigger v11_brigades_updated_at before update on public.v11_brigades
  for each row execute function public.v11_set_updated_at();
create trigger v11_tickets_version before update on public.v11_tickets
  for each row execute function public.v11_increment_ticket_version();

-- Security-definer helpers avoid RLS recursion. They return no data beyond a boolean.
create or replace function public.v11_is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.v11_memberships
    where user_id = auth.uid() and active and role = 'mt_superadmin'
  );
$$;

create or replace function public.v11_has_role(target_institution uuid, allowed_roles public.v11_app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select public.v11_is_superadmin() or exists (
    select 1 from public.v11_memberships
    where user_id = auth.uid()
      and institution_id = target_institution
      and active
      and role = any(allowed_roles)
  );
$$;

create or replace function public.v11_is_brigade_member(target_brigade uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.v11_brigade_members
    where brigade_id = target_brigade and user_id = auth.uid()
  );
$$;

create or replace function public.v11_write_audit(
  target_institution uuid,
  target_entity_type text,
  target_entity_id uuid,
  target_action text,
  prior jsonb,
  next jsonb,
  event_source text default 'web'
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.v11_audit_events (
    institution_id, actor_user_id, entity_type, entity_id, action, before_state, after_state, source
  ) values (
    target_institution, auth.uid(), target_entity_type, target_entity_id, target_action, prior, next, event_source
  );
end;
$$;

alter table public.v11_institutions enable row level security;
alter table public.v11_institution_settings enable row level security;
alter table public.v11_profiles enable row level security;
alter table public.v11_memberships enable row level security;
alter table public.v11_brigades enable row level security;
alter table public.v11_brigade_members enable row level security;
alter table public.v11_tickets enable row level security;
alter table public.v11_audit_events enable row level security;

create policy v11_institutions_read on public.v11_institutions for select to authenticated
  using (public.v11_is_superadmin() or public.v11_has_role(id, array['municipal_admin','supervisor','brigade_member']::public.v11_app_role[]));
create policy v11_institutions_manage on public.v11_institutions for all to authenticated
  using (public.v11_is_superadmin()) with check (public.v11_is_superadmin());

create policy v11_settings_read on public.v11_institution_settings for select to authenticated
  using (public.v11_has_role(institution_id, array['municipal_admin','supervisor','brigade_member']::public.v11_app_role[]));
create policy v11_settings_manage on public.v11_institution_settings for all to authenticated
  using (public.v11_has_role(institution_id, array['municipal_admin']::public.v11_app_role[]))
  with check (public.v11_has_role(institution_id, array['municipal_admin']::public.v11_app_role[]));

create policy v11_profiles_self_read on public.v11_profiles for select to authenticated using (user_id = auth.uid());
create policy v11_profiles_self_update on public.v11_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy v11_memberships_read on public.v11_memberships for select to authenticated
  using (user_id = auth.uid() or public.v11_is_superadmin() or public.v11_has_role(institution_id, array['municipal_admin']::public.v11_app_role[]));
create policy v11_memberships_manage on public.v11_memberships for all to authenticated
  using (public.v11_is_superadmin()) with check (public.v11_is_superadmin());

create policy v11_brigades_read on public.v11_brigades for select to authenticated
  using (public.v11_has_role(institution_id, array['municipal_admin','supervisor','brigade_member']::public.v11_app_role[]));
create policy v11_brigades_manage on public.v11_brigades for all to authenticated
  using (public.v11_has_role(institution_id, array['municipal_admin','supervisor']::public.v11_app_role[]))
  with check (public.v11_has_role(institution_id, array['municipal_admin','supervisor']::public.v11_app_role[]));

create policy v11_brigade_members_read on public.v11_brigade_members for select to authenticated
  using (user_id = auth.uid() or public.v11_is_brigade_member(brigade_id) or public.v11_is_superadmin());
create policy v11_brigade_members_manage on public.v11_brigade_members for all to authenticated
  using (public.v11_is_superadmin()) with check (public.v11_is_superadmin());

create policy v11_tickets_read_staff on public.v11_tickets for select to authenticated
  using (
    public.v11_has_role(institution_id, array['municipal_admin','supervisor']::public.v11_app_role[])
    or (assigned_brigade_id is not null and public.v11_is_brigade_member(assigned_brigade_id))
  );
-- There is intentionally no direct ticket insert/update/delete policy. RPC owns the workflow.

create policy v11_audit_read on public.v11_audit_events for select to authenticated
  using (public.v11_is_superadmin() or public.v11_has_role(institution_id, array['municipal_admin','supervisor']::public.v11_app_role[]));
-- There is intentionally no client write policy for audit events.

revoke all on public.v11_institutions, public.v11_institution_settings, public.v11_profiles,
  public.v11_memberships, public.v11_brigades, public.v11_brigade_members, public.v11_tickets,
  public.v11_audit_events from anon;
grant select on public.v11_institutions, public.v11_institution_settings, public.v11_profiles,
  public.v11_memberships, public.v11_brigades, public.v11_brigade_members, public.v11_tickets,
  public.v11_audit_events to authenticated;
grant insert, update on public.v11_profiles to authenticated;

-- Keep audit writes internal; RLS helpers must be callable by authenticated policy evaluation only.
revoke all on function public.v11_write_audit(uuid, text, uuid, text, jsonb, jsonb, text) from public;
revoke all on function public.v11_handle_new_user() from public;
revoke all on function public.v11_is_superadmin() from public;
revoke all on function public.v11_has_role(uuid, public.v11_app_role[]) from public;
revoke all on function public.v11_is_brigade_member(uuid) from public;
grant execute on function public.v11_is_superadmin() to authenticated;
grant execute on function public.v11_has_role(uuid, public.v11_app_role[]) to authenticated;
grant execute on function public.v11_is_brigade_member(uuid) to authenticated;
