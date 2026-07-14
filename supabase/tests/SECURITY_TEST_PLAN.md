# Plan de pruebas de seguridad V1.1

Estas pruebas requieren una instancia Supabase `dev` vacía o con datos sintéticos, la migración aplicada y seis usuarios de prueba: superadministrador MT, administrador A, supervisor A, brigada A, administrador B y brigada B.

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| Crear institución | Superadministrador crea A y B, con settings y brigadas. | Éxito y auditoría asociada. |
| Aislamiento | Administrador A consulta/actualiza ticket o brigada B. | Cero filas o error de autorización. |
| Login/perfil | Usuario nuevo inicia sesión. | Se crea solo su perfil; no obtiene membresía ni institución. |
| Roles | Supervisor A intenta administrar membresías; brigada A intenta asignar ticket. | Denegado. |
| Administración | Administrador A asigna ticket A a brigada A con versión actual. | Estado `assigned`, versión incrementada y evento de auditoría. |
| Brigada | Brigada A lista tickets. | Solo tickets asignados a su brigada A. |
| Ciudadano | Anónimo invoca `v11_create_citizen_ticket` con institución A. | Ticket nuevo y secreto de seguimiento una sola vez. |
| Seguimiento | Consultar ticket con secreto inválido o ID inexistente. | Misma respuesta vacía; no se filtra existencia. |
| Estados | Ejecutar transición fuera de orden o con versión vieja. | Error de conflicto; no cambia datos. |
| Evidencia | Brigada A sube a ruta de ticket B o bucket equivocado. | Denegado por Storage RLS. |
| Verificación | Supervisor A aprueba/devuelve resolución A. | Solo desde `pending_verification`; auditoría correcta. |
| Auditoría | Usuario cliente intenta insertar/modificar `v11_audit_events`. | Denegado. |

## Ejecución propuesta

1. Crear usuarios sintéticos mediante el flujo de Auth autorizado.
2. Asignar membresías únicamente con un contexto administrador autorizado.
3. Ejecutar cada caso con el JWT del usuario indicado usando `supabase db test`, un cliente de integración o SQL con JWT simulado aprobado.
4. Conservar únicamente IDs sintéticos y resultados redactados en el reporte de pruebas.

## Estado en esta misión

No ejecutable localmente: no hay CLI Supabase, base PostgreSQL ni proyecto `dev` identificado. Este documento define los casos que deben aprobarse antes de staging.
