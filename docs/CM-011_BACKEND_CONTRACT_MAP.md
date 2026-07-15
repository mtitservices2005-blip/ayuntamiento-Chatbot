# CM-011 Backend Contract Map — Supabase V1.1

Verificado el 2026-07-15 por inspección estática de `supabase/migrations/` y documentación existente. No se consultó ni modificó Supabase remoto.

## Estado de contratos

| Área | Contrato | Estado | Evidencia |
|---|---|---:|---|
| Roles | `v11_app_role`: `mt_superadmin`, `municipal_admin`, `supervisor`, `brigade_member` | CONFIRMED | SQL enum |
| Tickets | `v11_ticket_status`: `received`, `assigned`, `in_progress`, `pending_verification`, `resolved` | CONFIRMED | SQL enum |
| Instituciones | `v11_institutions(id, slug, legal_name, active, created_at, updated_at)` | CONFIRMED | SQL table |
| Configuración | `v11_institution_settings(institution_id, public_name, support_email, support_phone, logo_path, ticket_categories, sectors, public_content, file_policy, updated_at)` | CONFIRMED | SQL table |
| Perfiles | `v11_profiles(user_id, display_name, created_at, updated_at)` | CONFIRMED | SQL table + auth trigger |
| Memberships | `v11_memberships(id, institution_id, user_id, role, active, created_at, updated_at)` | CONFIRMED | SQL table |
| Brigadas | `v11_brigades(id, institution_id, name, description, active, created_at, updated_at)` | CONFIRMED | SQL table |
| Miembros de brigada | `v11_brigade_members(brigade_id, user_id, created_at)` | CONFIRMED | SQL table |
| Tickets | `v11_tickets` con `institution_id`, `public_id`, secreto hash, categoría, ubicación, status, brigada, evidencias, versionado y timestamps | CONFIRMED | SQL table |
| Auditoría | `v11_audit_events(id, institution_id, actor_user_id, entity_type, entity_id, action, before_state, after_state, source, created_at)` | CONFIRMED | SQL table |
| Eventos integración | `v11_integration_events` y enum `v11_integration_event_status` | CONFIRMED | SQL table; sin grants cliente |
| Realtime | Canales/subscriptions cliente | UNKNOWN | No hay contrato SQL/documentado operativo |

## RPCs y funciones confirmadas

| Función/RPC | Parámetros | Resultado | Estado | Uso seguro V2 |
|---|---|---|---:|---|
| `v11_create_citizen_ticket` | `target_institution uuid`, categoría, descripción, sector, ubicación, lat/lon, `ticket_evidence_path` | tabla con `public_id`, `tracking_secret` | CONFIRMED | Citizen Portal, anon/authenticated |
| `v11_get_citizen_ticket` | `ticket_public_id uuid`, `provided_secret text` | `public_id`, `category`, `status`, `created_at`, `updated_at` | CONFIRMED | Tracking ciudadano |
| `v11_assign_ticket` | `target_ticket uuid`, `target_brigade uuid`, `expected_version integer` | `v11_tickets` | CONFIRMED | Municipal Panel por roles permitidos |
| `v11_start_ticket_work` | `target_ticket uuid`, `expected_version integer` | `v11_tickets` | CONFIRMED | Brigade Portal |
| `v11_submit_ticket_resolution` | ticket, versión, `evidence_path`, nota | `v11_tickets` | CONFIRMED | Brigade Portal |
| `v11_review_ticket_resolution` | ticket, versión, approve, nota | `v11_tickets` | CONFIRMED | Municipal Panel |
| `v11_get_public_institution_config` | `target_slug text` | `jsonb` público con id, slug, nombre, logo, categorías, sectores, contenido y file_policy disabled | CONFIRMED | Configuration/Citizen Portal lectura pública |
| Helpers RLS/storage/audit | `v11_is_superadmin`, `v11_has_role`, `v11_is_brigade_member`, `v11_write_audit`, storage helpers | boolean/void | CONFIRMED | No son API de escritura frontend salvo helpers concedidos |

## Relaciones y multiinstitución

- Identificador institucional confirmado: `institution_id` UUID.
- Membership confirmado: usuario Auth pertenece a una institución con un rol V1.1 y `active = true`.
- Brigadas pertenecen a institución; tickets asignan brigada por FK compuesta `(institution_id, assigned_brigade_id)`.
- Tickets usan versionado optimista mediante `version` y trigger de incremento.

## Transiciones de tickets confirmadas

`received -> assigned -> in_progress -> pending_verification -> resolved`; la revisión rechazada vuelve de `pending_verification` a `in_progress`. Cada transición confirmada valida rol/membership/brigada y versión dentro de RPC.

## Storage confirmado

| Bucket | Estado | Path confirmado | Políticas |
|---|---:|---|---|
| `ticket-evidence-v11` | DOCUMENTED_ONLY como bucket; policies CONFIRMED | `institution_id/pending/...` para evidencia ciudadana aceptada por RPC, pero sin upload directo ciudadano | lectura staff/brigada si objeto asociado |
| `resolution-evidence-v11` | DOCUMENTED_ONLY como bucket; policies CONFIRMED | `institution_id/ticket_id/resolution/filename` | lectura staff/brigada; insert authenticated para brigada asignada |

Los buckets son prerrequisito manual y la migración no los crea. No existe Edge Function versionada para upload ciudadano confiable.

## RLS confirmada

RLS está habilitada en tablas V1.1. Hay lectura autenticada por rol para instituciones, settings, memberships, brigadas, tickets y auditoría; las mutaciones críticas de tickets no tienen políticas directas y quedan bajo RPC. `v11_integration_events` no concede acceso a clientes.

## Gaps principales

Los gaps están desarrollados en `docs/CM-011_BACKEND_GAPS.md`: configuración pública de ambiente no instanciada localmente, falta Edge Function de evidencia ciudadana, ausencia de RPCs administrativas completas, ausencia de proveedor notificaciones y ausencia de Realtime confirmado.
