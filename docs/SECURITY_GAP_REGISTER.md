# CM-030 Security Gap Register

Scope: static audit only; no production access, no remote DB push, no secret rotation, no Meta connection.

| ID | Area | Status | Evidence | Gap / risk | Severity | Required mission |
|---|---|---|---|---|---|---|
| SEC-001 | Secret exposure | PARTIAL | Tracked config uses `YOUR_DEV_PROJECT` / `YOUR_DEV_ANON_KEY`; no `service_role` literal found in application code search. | Need formal secret scan including git history and deployment settings. | High | CM-043 |
| SEC-002 | Supabase anon config | PARTIAL | `v1.1` expects `config.local.js`; example warns dev anon key only. | Runtime may be misconfigured; no environment validation report. | High | CM-031 |
| SEC-003 | Service role | PARTIAL | Search found policy docs/copy only, no client service-role usage. | Git history and CI secrets not scanned; backend workers not present. | Critical | CM-043 |
| SEC-004 | RLS execution | REAL_NOT_RUN | Migrations define RLS and grants. | No positive/negative RLS tests run; cross-tenant access unproven. | Critical | CM-031 |
| SEC-005 | Cross-tenant access | REAL_NOT_RUN | `v11_has_role` and institution-scoped tables exist. | No two-tenant fixture test; `mt_superadmin` broad access requires validation. | Critical | CM-042 |
| SEC-006 | Frontend role trust | PARTIAL | Frontend navigation/config modules list roles and warn that auth must be backend-enforced. | Demo modules may imply authorization while relying on UI only. | High | CM-039 |
| SEC-007 | Privileged client operations | PARTIAL | Real V1.1 uses RPCs for ticket mutations; staff currently reads table directly. | Admin/brigade mutation UI not wired, future direct updates must be prohibited. | High | CM-037 |
| SEC-008 | Citizen uploads | BLOCKED | No direct citizen insert policy; code refuses upload. | Evidence upload needs MIME/size validation, malware consideration, path binding, rate limits. | High | CM-035 |
| SEC-009 | Bucket privacy | REAL_NOT_RUN | Migration policies reference private expected buckets but do not create them. | Actual bucket public/private state unknown. | Critical | CM-035 |
| SEC-010 | XSS/HTML injection | PARTIAL | Several demo modules use `innerHTML` with config/state strings. | Sanitization not systematically proven; content/config values could become admin-controlled later. | High | CM-043 |
| SEC-011 | Input validation | PARTIAL | RPC validates core ticket fields; frontend validates some lengths/files. | Service request flows, config module, demo modules not backend-validated. | High | CM-033/CM-039 |
| SEC-012 | Rate limiting / abuse | BLOCKED | Anonymous ticket creation RPC is grantable to `anon`. | No CAPTCHA, rate limit, or abuse controls documented. | High | CM-043 |
| SEC-013 | Audit integrity | REAL_NOT_RUN | `v11_write_audit` exists and client write is revoked. | Audit write coverage not execution-tested for every transition. | Medium | CM-037 |
| SEC-014 | Dependency supply chain | PARTIAL | Supabase JS loaded from CDN in HTML. | No SRI/integrity, lockfile, or automated dependency scan. | Medium | CM-044 |
| SEC-015 | Error leakage | PARTIAL | UI may display raw Supabase error messages in real V1.1. | Could expose SQL/RLS details to citizens/staff. | Medium | CM-043 |
| SEC-016 | Realtime | DEMO_ONLY | No real realtime channels found. | Future realtime must enforce tenant filters server-side/RLS. | Medium | CM-040 |
| SEC-017 | Integration events | PARTIAL | Event table revoked from anon/authenticated. | Server handler auth/idempotency/signature validation not implemented. | Medium | CM-045 |

## Immediate security freeze

- Do not enable citizen evidence upload until CM-035 delivers trusted upload controls.
- Do not treat UI role filtering as authorization.
- Do not publish demo costs/impact/content as official data.
- Do not connect Meta or any outbound notification provider before the real persistence, auth, and RLS proof missions pass.
