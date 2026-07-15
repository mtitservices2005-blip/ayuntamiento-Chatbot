# CM-030 Migration Audit

No remote `supabase db push` was executed. No production database was touched. This audit is static plus repository test evidence only.

## Complete order

1. `202607140001_v11_tenancy_auth_audit.sql` — core extension, enums, tables, indexes, triggers, RLS helpers, policies, grants.
2. `202607140002_v11_ticket_rpc.sql` — citizen ticket RPCs and staff/brigade workflow RPCs.
3. `202607140003_v11_storage_policies.sql` — storage helper functions and policies; does **not** create buckets.
4. `202607140004_v11_public_config_rpc.sql` — public institution configuration RPC.
5. `202607140005_v11_integration_event_contract.sql` — integration event contract table/type only.

## Expected database objects

### Extensions and enums
- Extension: `pgcrypto`.
- Enums: `v11_app_role`, `v11_ticket_status`, `v11_integration_event_status`.

### Tables
- `v11_institutions`
- `v11_institution_settings`
- `v11_profiles`
- `v11_memberships`
- `v11_brigades`
- `v11_brigade_members`
- `v11_tickets`
- `v11_audit_events`
- `v11_integration_events`

### RPCs / functions
- Auth/profile helpers: `v11_handle_new_user`, `v11_set_updated_at`.
- Authorization helpers: `v11_is_superadmin`, `v11_has_role`, `v11_is_brigade_member`.
- Audit helper: `v11_write_audit`.
- Ticket workflow: `v11_create_citizen_ticket`, `v11_get_citizen_ticket`, `v11_assign_ticket`, `v11_start_ticket_work`, `v11_submit_ticket_resolution`, `v11_review_ticket_resolution`.
- Storage helpers: `v11_storage_institution_id`, `v11_can_read_storage_object`, `v11_can_write_resolution_object`.
- Public config: `v11_get_public_institution_config`.

### Triggers
- `v11_on_auth_user_created` on `auth.users`.
- Updated-at/version triggers on institutions, settings, profiles, memberships, brigades, tickets.

### Policies
- Table policies for institution/settings/profile/membership/brigade/brigade_members/tickets/audit read/manage paths.
- Storage object policies for staff read on `ticket-evidence-v11` and `resolution-evidence-v11`, plus brigade insert on `resolution-evidence-v11`.

### Buckets
- Expected private buckets: `ticket-evidence-v11`, `resolution-evidence-v11`.
- Migration explicitly does not create buckets, so a db reset will not recreate complete storage state.

## Duplicates and conflicts

- No duplicate migration filenames found.
- No repeated `create table` names across the five files.
- Potential conflict: `create type` is not guarded with `if not exists`; re-running against a partially applied DB can fail.
- Potential conflict: trigger/function names assume clean namespace and can conflict with partial application.
- Potential SQL risk: `v11_get_citizen_ticket` uses `extensions.crypt`; `pgcrypto` availability/schema should be validated in the target Supabase project.

## Draft / not-applied indicators

- `202607140003` says buckets must be created manually and deliberately does not alter buckets.
- Repository docs include manual security/test plans; no migration application report with timestamps or Supabase project ref was found.
- Therefore all migrations are classified `REAL_NOT_RUN` until CM-031 produces applied migration evidence.

## Reset risks

- `db reset` may drop data and will not recreate Storage buckets because migrations do not create buckets.
- Seed data for institutions, settings, memberships, brigades, test users, and buckets is not represented in migrations.
- Existing real users in `auth.users` are external to SQL migrations; resetting a project would invalidate membership assumptions.
- Integration events have no client grants; server-side workers would need separate deployment not captured in DB reset.

## Required CM-031 migration proof

- Apply to disposable local/dev Supabase only.
- Capture migration version list, object existence checks, policy list, function grants, and bucket existence.
- Run positive and negative RLS tests for two tenants and all roles.
