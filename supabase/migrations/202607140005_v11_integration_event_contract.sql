-- Event contracts only. No webhook, credentials or third-party communication is enabled by this migration.
create type public.v11_integration_event_status as enum ('pending', 'processing', 'succeeded', 'failed', 'dead_letter');

create table public.v11_integration_events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.v11_institutions(id) on delete restrict,
  provider text not null check (provider in ('whatsapp_business', 'smartwaste')),
  direction text not null check (direction in ('inbound', 'outbound')),
  event_type text not null check (char_length(event_type) between 2 and 100),
  idempotency_key text not null check (char_length(idempotency_key) between 8 and 255),
  aggregate_type text,
  aggregate_id uuid,
  status public.v11_integration_event_status not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, direction, idempotency_key)
);
create index v11_integration_events_dispatch_idx on public.v11_integration_events (status, created_at);
alter table public.v11_integration_events enable row level security;
-- No client policy or grant: trusted server-side handlers own integration events.
revoke all on public.v11_integration_events from anon, authenticated;
