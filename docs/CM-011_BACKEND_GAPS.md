# CM-011 Backend Gaps

| Necesidad | Módulo afectado | Contrato faltante | Riesgo | Propuesta | Migración futura sugerida | Aprobación humana |
|---|---|---|---|---|---|---:|
| Upload ciudadano de evidencia | Citizen Portal / Storage | Edge Function o mecanismo seguro para validar MIME/tamaño y escribir `ticket-evidence-v11` | abuso de storage, costos, bypass de validación | Diseñar función server-side con límites y asociación posterior al ticket | Sí, función + pruebas; no bucket remoto desde esta misión | YES |
| Buckets reales | Storage | Buckets privados `ticket-evidence-v11`, `resolution-evidence-v11` existen solo como prerrequisito documentado | políticas sin bucket aplicado no bastan | Crear buckets en ambiente aprobado con checklist | No necesariamente SQL; procedimiento controlado | YES |
| Administración transaccional | Master Admin | RPCs para gestionar instituciones, memberships, roles, brigadas y usuarios Auth | acciones administrativas incompletas o inseguras si se hacen directo desde UI | Diseñar RPCs/Edge Functions con auditoría | Sí, migraciones separadas | YES |
| Notificaciones reales | Notifications | proveedor, worker, secrets, retries y auditoría de entregas | costos/envío accidental | Mantener simulador hasta aprobar proveedor | Posible tabla de delivery attempts y worker | YES |
| Realtime | Todos | contrato de canales y filtros | filtración cross-tenant si se improvisa | Definir canales por institución con RLS validada | No hasta validación dev | YES |
| Correlation IDs explícitos | Audit/Observabilidad | columna o propagación formal de correlation id | trazabilidad incompleta | Añadir contrato de correlation id si negocio lo requiere | Migración futura de audit/events | YES |
