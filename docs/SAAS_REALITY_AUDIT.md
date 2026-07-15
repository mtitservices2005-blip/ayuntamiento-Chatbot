# CM-030 SaaS Reality Audit & Functional Freeze

## Executive conclusion

The repository contains a strong V1.1 SaaS skeleton, demo UX, static tests, and Supabase migration contracts, but **no audited capability qualifies as `REAL_VERIFIED` in CM-030** because this mission did not run an applied Supabase environment or capture real backend execution evidence. The functional scope is frozen until CM-031 proves the database, Auth, RLS, and core RPCs in an authorized dev/disposable environment.

## Evidence standard

`REAL_VERIFIED` requires actual execution evidence: applied migrations, real Auth sessions/users, RLS-positive and RLS-negative checks, persisted rows, storage object checks, and test logs. Code presence, static tests, adapters, migrations, contracts, and documentation are insufficient.

## Tests/checks executed in CM-030

- `for t in tests/frontend/*.mjs; do node "$t"; done` — PASS. These are static/Node checks of demo/frontend source.
- `pwsh -NoProfile -File tests/static_v11_contract.ps1` — NOT_RUN because `pwsh` is not installed in this container.
- No browser E2E, remote Supabase, local Supabase, Storage, Auth, Meta, or production command was executed.

## Area findings

### 1. Frontend ciudadano
- Status: PARTIAL.
- Real V1.1 citizen frontend calls Supabase RPCs through `v1.1/js/api.js` and handles GPS/evidence validation in `v1.1/js/citizen.js`.
- Blocker: no configured real dev Supabase run in this audit.

### 2. Incidencias REP-
- Status: DEMO_ONLY.
- `REP-` is a demo-facing concept in chatbot/config, not the persisted V1.1 DB identifier.
- Blocker: canonical folio model missing.

### 3. Solicitudes SOL-
- Status: DEMO_ONLY.
- Service requests and costs are simulated in the chatbot demo; no real `SOL` table/RPC exists.
- Blocker: service request persistence model missing.

### 4. Consulta unificada
- Status: PARTIAL.
- Real RPC `v11_get_citizen_ticket` supports lookup by UUID plus secret for tickets only.
- Blocker: no SOL backend and no real query run.

### 5. GPS
- Status: PARTIAL.
- Browser geolocation is implemented and DB columns exist.
- Blocker: no HTTPS browser E2E or persistence proof.

### 6. Evidencias
- Status: BLOCKED for citizen evidence; REAL_NOT_RUN for brigade resolution evidence.
- Citizen upload is intentionally blocked pending trusted backend upload path.
- Blocker: Edge Function / storage policy / bucket proof.

### 7. Costos
- Status: DEMO_ONLY.
- Cost data is marked demo or pending.
- Blocker: official tariff source and persistence.

### 8. Estados y workflow
- Status: PARTIAL.
- SQL RPCs define received → assigned → in_progress → pending_verification → resolved/returned transitions.
- Blocker: no applied DB workflow tests.

### 9. Centro de Comando
- Status: DEMO_ONLY/PARTIAL.
- Demo municipal panel is static; V1.1 admin can list tickets after auth but has no audited real mutation workflow.

### 10. Brigada
- Status: PARTIAL.
- Auth-gated brigade page lists tickets; full start/submit workflow UI not proven.

### 11. Centro de Impacto
- Status: DEMO_ONLY.
- Metrics are demo/static calculations, not real ticket aggregates.

### 12. Auth
- Status: REAL_NOT_RUN.
- Supabase Auth integration exists but login was not executed.

### 13. Roles
- Status: REAL_NOT_RUN.
- Role enum and membership checks exist; no real user fixtures or session evidence.

### 14. RLS
- Status: REAL_NOT_RUN.
- Policies exist statically; no isolation proof.

### 15. Persistencia
- Status: REAL_NOT_RUN.
- Ticket persistence RPC exists; not executed.

### 16. Storage
- Status: BLOCKED.
- Policies exist, buckets are manual and unverified.

### 17. Realtime
- Status: DEMO_ONLY.
- No real realtime subscription implementation found.

### 18. Notificaciones
- Status: DEMO_ONLY.
- Templates/UI exist; no dispatch provider or worker.

### 19. Multiayuntamiento
- Status: PARTIAL.
- Tenant schema exists; isolation tests missing.

### 20. Contratos WhatsApp
- Status: DEMO_ONLY.
- Channel contracts and integration event table exist; Meta is not connected.

### 21. Migraciones
- Status: REAL_NOT_RUN.
- Static order is coherent but not applied here.

### 22. Tests
- Status: PARTIAL.
- Demo/source tests pass; PowerShell static contract not runnable here; no DB/browser tests.

### 23. Configuración
- Status: PARTIAL.
- Real public config RPC exists; admin configuration UI is demo-only.

### 24. Dependencias
- Status: PARTIAL.
- CDN Supabase dependency is used; no package lock or SRI policy.

### 25. Seguridad
- Status: PARTIAL.
- Good intent in RLS/no service-role client pattern, but runtime proof missing.

## Freeze statement

Until CM-031 passes, the system must be described as: **demo-capable frontend plus unverified Supabase SaaS contract**. No production launch, Meta connection, remote db push, or citizen evidence enablement should occur from this branch.
