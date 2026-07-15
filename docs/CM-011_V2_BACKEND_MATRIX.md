# CM-011 V2 → Backend Matrix

| Módulo V2 | Auth | Tablas | RPCs | RLS | Storage | Auditoría | Realtime | Eventos | Estado | Bloqueos |
|---|---|---|---|---|---|---|---|---|---:|---|
| Authentication V2 | Supabase Auth + memberships | `v11_memberships` | none | confirmada | n/a | indirecta | UNKNOWN | n/a | READY | Claims frontend no son autoridad; usar memberships. |
| Citizen Portal V2 | anon/auth opcional | `v11_tickets` vía RPC | create/get ticket, public config | RPC security definer | PARTIAL | `created` interno | UNKNOWN | n/a | PARTIAL | Upload ciudadano requiere función confiable no versionada. |
| Municipal Panel V2 | authenticated | tickets, brigades, settings | assign/review | confirmada | lectura evidence | audit read | UNKNOWN | n/a | PARTIAL | Operaciones admin fuera de tickets no tienen RPC dedicada. |
| Brigade Portal V2 | authenticated | tickets asignados, brigade_members | start/submit | confirmada | upload resolución | audit indirecta | UNKNOWN | n/a | PARTIAL | Necesita obtener brigade_id por membership; no hay RPC específica. |
| Master Admin V2 | authenticated | institutions, memberships, brigades | none | solo superadmin para algunas tablas | n/a | lectura | UNKNOWN | integration table sin grant | PARTIAL | No hay RPC administrativa transaccional ni gestión usuarios Auth. |
| Configuration V2 | anon/auth | settings/institutions | public config | lectura pública vía RPC; escritura RLS admin | n/a | indirecta | UNKNOWN | n/a | PARTIAL | Escritura config desde UI requiere diseño/revisión. |
| Notifications V2 | n/a | integration_events sin grant cliente | none | sin acceso cliente | n/a | posible futuro | UNKNOWN | contract only | DEMO_ONLY | No hay proveedor, worker ni grant cliente. |
| Audit V2 | authenticated | `v11_audit_events` | none | lectura admin/supervisor/superadmin | n/a | tabla confirmada | UNKNOWN | n/a | READY | Solo lectura; no escribir desde frontend. |
| Storage & Evidence V2 | authenticated/anon parcial | tickets storage paths | submit resolution validates path | policies confirmadas | PARTIAL | indirecta | UNKNOWN | n/a | PARTIAL | Buckets no creados por migración; evidencia ciudadana bloqueada sin Edge Function. |
