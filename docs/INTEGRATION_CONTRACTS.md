# Contratos de integración futura

## Principio común

WhatsApp Business Platform y SmartWaste se integrarán desde funciones de servidor o workers autenticados. Las interfaces web no reciben tokens de proveedores, no envían mensajes y no escriben directamente eventos de integración.

`v11_integration_events` es una cola/auditoría local preparada para eventos idempotentes; la migración no activa ninguna integración.

## WhatsApp Business Platform

- Verificar la firma del webhook antes de interpretar el cuerpo.
- Usar el identificador de mensaje del proveedor como `idempotency_key`.
- Resolver la institución por número/canal registrado, nunca por valor enviado libremente por el usuario.
- Guardar solo el mínimo necesario y aplicar consentimiento/plantillas aprobadas.
- Correlacionar un ticket mediante su secreto de seguimiento o flujo autenticado; no revelar tickets por número predecible.
- Encolar reintentos con backoff; no reenviar mensajes manualmente desde la interfaz sin autorización.

## SmartWaste

- Autenticar servicio a servicio con secreto almacenado solo en el entorno de funciones.
- Versionar cada payload y mapear categorías/rutas por `institution_id`.
- Usar ID externo como `idempotency_key`; registrar estados `pending`, `succeeded`, `failed` o `dead_letter`.
- Separar datos operativos de datos ciudadanos; no sincronizar fotos, contacto ni geolocalización precisa salvo acuerdo de privacidad aprobado.

## Antes de activar

Se requieren credenciales sandbox, acuerdos de datos, evaluación de privacidad, endpoint HTTPS, verificación de firmas, pruebas de reintentos y aprobación humana. Ninguno de estos puntos está autorizado o configurado en esta misión.
