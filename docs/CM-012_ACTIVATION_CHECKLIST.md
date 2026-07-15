# CM-012 Activation Checklist — Entorno real autorizado

No ejecutar estas acciones desde esta misión sin aprobación humana explícita. Este checklist prepara un piloto controlado.

## 1. Supabase y configuración pública

- [ ] Aprobar proyecto Supabase piloto/no productivo.
- [ ] Registrar URL pública del proyecto como variable de entorno cliente.
- [ ] Registrar anon/publishable key pública como variable de entorno cliente.
- [ ] Confirmar que ninguna `service_role` key se expone al frontend.
- [ ] Confirmar dominio/hosting autorizado para pruebas.

## 2. Esquema, RLS y RPCs

- [ ] Confirmar migraciones V1.1 aplicadas en ambiente aprobado.
- [ ] Validar enums `v11_app_role` y `v11_ticket_status`.
- [ ] Validar RLS activo en tablas V1.1.
- [ ] Validar RPCs: `v11_create_citizen_ticket`, `v11_get_citizen_ticket`, `v11_assign_ticket`, `v11_start_ticket_work`, `v11_submit_ticket_resolution`, `v11_review_ticket_resolution`, `v11_get_public_institution_config`.
- [ ] Validar auditoría `v11_audit_events` para cambios de ticket.

## 3. Datos piloto

- [ ] Crear institución piloto activa.
- [ ] Configurar `v11_institution_settings` con categorías, sectores, contenido público y política de archivos.
- [ ] Crear usuarios de prueba aprobados: municipal admin, supervisor y brigada.
- [ ] Crear memberships activos por institución y rol.
- [ ] Crear brigada activa.
- [ ] Asociar usuario de brigada en `v11_brigade_members`.

## 4. Storage y evidencias

- [ ] Crear bucket privado `ticket-evidence-v11` solo en ambiente aprobado.
- [ ] Crear bucket privado `resolution-evidence-v11` solo en ambiente aprobado.
- [ ] Verificar policies de lectura staff/brigada.
- [ ] Verificar policy de insert autenticado para resolución.
- [ ] Validar path `institution_id/ticket_id/resolution/filename`.
- [ ] Definir Edge Function o mecanismo seguro para evidencia ciudadana antes de habilitar upload anónimo.
- [ ] Validar MIME y tamaño según `file_policy`.

## 5. Pruebas E2E reales

- [ ] Crear ticket ciudadano de prueba autorizado.
- [ ] Guardar folio y secreto de seguimiento de forma segura.
- [ ] Consultar ticket ciudadano con credenciales válidas.
- [ ] Confirmar no filtración con credenciales inválidas.
- [ ] Listar ticket como municipal admin/supervisor.
- [ ] Asignar brigada con `expected_version` correcto.
- [ ] Consultar ticket como brigada asignada.
- [ ] Iniciar trabajo.
- [ ] Subir evidencia de resolución al bucket aprobado.
- [ ] Enviar a verificación.
- [ ] Devolver a brigada con nota.
- [ ] Reenviar a verificación.
- [ ] Aprobar resolución.
- [ ] Consultar estado final como ciudadano.
- [ ] Revisar eventos de auditoría.

## 6. Operación, seguridad y aprobación

- [ ] Definir backups y retención.
- [ ] Definir monitoring y alertas.
- [ ] Revisar privacidad y tratamiento de datos ciudadanos.
- [ ] Revisar costos de Storage, Auth, Edge Functions y notificaciones.
- [ ] Aprobar proveedor de notificaciones antes de envíos reales.
- [ ] Aprobar despliegue de Edge Functions antes de upload ciudadano.
- [ ] Aprobación humana de responsable municipal y responsable técnico.
