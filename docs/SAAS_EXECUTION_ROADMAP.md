# CM-030 SaaS Execution Roadmap

This roadmap converts the audit into dependency-ordered missions. Each mission must produce real evidence or keep the affected capability out of `REAL_VERIFIED`.

## CM-031 — Dev Supabase reality harness
- Goal: prove migrations, Auth, RLS, basic persistence in disposable/authorized dev only.
- Depends on: CM-030.
- Deliverables: applied migration log, object inventory, seeded two tenants, users per role, RLS positive/negative tests, citizen create/lookup RPC execution.
- Unlocks: CM-032, CM-035, CM-037, CM-042.

## CM-032 — Canonical folio model
- Goal: decide and implement real public references for `REP-` vs UUID without changing citizen UX unexpectedly.
- Depends on: CM-031 persistence proof.
- Deliverables: migration/RPC update if needed, backward-compatible lookup contract, tests.

## CM-033 — Real municipal service requests
- Goal: convert `SOL-` service desk from demo to real schema/workflow or explicitly remove production claims.
- Depends on: CM-031, CM-032.
- Deliverables: service request tables/RPCs, official tariff source model, validation tests.

## CM-034 — GPS browser and persistence proof
- Goal: prove GPS consent/error flows and persisted coordinates in real tickets.
- Depends on: CM-031.
- Deliverables: browser E2E under HTTPS/localhost, DB row evidence, privacy copy review.

## CM-035 — Evidence upload backend
- Goal: implement trusted citizen upload and verify private buckets.
- Depends on: CM-031.
- Deliverables: private bucket creation procedure, Edge Function or approved storage design, MIME/size/path/rate-limit controls, upload/read tests.

## CM-036 — Real brigade execution UI
- Goal: connect brigade UI to start work and submit resolution evidence RPCs.
- Depends on: CM-031, CM-035 for evidence.
- Deliverables: role-gated UI, optimistic version handling, tests.

## CM-037 — Real command center workflow
- Goal: connect municipal panel/admin to assign/review ticket RPCs and audit events.
- Depends on: CM-031, CM-036.
- Deliverables: assignment/review UI, audit proof, conflict tests.

## CM-038 — Real impact metrics
- Goal: replace demo impact center with aggregates from real tickets/resolutions.
- Depends on: CM-037.
- Deliverables: metrics SQL/RPC, tenant-scoped dashboards, no demo data in production mode.

## CM-039 — Real configuration and content workflow
- Goal: persist institution settings, categories, sectors, branding, and institutional content with approvals.
- Depends on: CM-031.
- Deliverables: settings CRUD RPCs, content statuses, storage for logos/photos, admin tests.

## CM-040 — Realtime after RLS proof
- Goal: add tenant-safe realtime subscriptions for staff views.
- Depends on: CM-037 and CM-042.
- Deliverables: subscriptions scoped by tenant/role, reconnection/error behavior tests.

## CM-041 — Notification dispatch service
- Goal: implement internal notifications only after real workflow states are proven.
- Depends on: CM-037.
- Deliverables: outbox/worker, templates, delivery audit, no external provider secrets in frontend.

## CM-042 — Multiayuntamiento isolation certification
- Goal: certify cross-tenant isolation across tables, RPCs, storage, realtime, config, and dashboards.
- Depends on: CM-031, CM-035, CM-037, CM-039.
- Deliverables: automated two-tenant security suite.

## CM-043 — Security hardening pass
- Goal: secret scan, XSS audit, error handling, abuse controls, upload hardening review.
- Depends on: CM-031 and CM-035.
- Deliverables: security gap closure report and tests.

## CM-044 — Dependency and delivery hardening
- Goal: decide CDN vs bundling, SRI/lockfiles, CI runner coverage, browser E2E setup.
- Depends on: CM-031.
- Deliverables: reproducible dependency policy and CI checks.

## CM-045 — WhatsApp/Meta integration design only
- Goal: design Meta integration from proven internal contracts; no production connection until approved.
- Depends on: CM-041, CM-042, CM-043.
- Deliverables: webhook signature/idempotency design, event mapping, sandbox plan.

## CM-046+ — Controlled external integrations
- Goal: connect WhatsApp or other providers only after written approval and secret management controls.
- Depends on: CM-045 approval.
