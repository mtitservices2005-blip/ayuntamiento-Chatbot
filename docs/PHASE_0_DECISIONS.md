# Fase 0 — Decisiones y criterios de salida

## Decisiones locales adoptadas

- Se preserva la V1 existente durante la construcción: V1.1 se entrega como una superficie nueva y modular, sin reutilizar sus credenciales ni sus identificadores fijos.
- El límite de aislamiento se denomina `institution_id`; un ayuntamiento es una institución. Ninguna interfaz V1.1 elige libremente este valor para acciones privilegiadas.
- La fuente de autoridad es Supabase Auth más membresías institucionales. El navegador solo presenta capacidades concedidas por el servidor/RLS.
- Las transiciones de tickets y la auditoría se concentran en funciones SQL transaccionales, no en `update` directos del cliente.
- Las fotos son privadas y sus rutas incluyen institución y ticket. La validación final de archivos requiere un servicio/función de confianza antes de producción.

## Criterios de seguridad de V1.1

1. RLS está habilitado en toda tabla y bucket expuesto.
2. Un usuario no puede leer ni escribir datos de otra institución.
3. El rol de brigada solo recibe tickets de su brigada y solo puede ejecutar sus transiciones permitidas.
4. Las acciones administrativas dejan una auditoría atribuible.
5. La consulta ciudadana exige un secreto de seguimiento de alta entropía y no revela si un ticket no existe.
6. Las rutas de Storage no son públicas y las URLs firmadas tienen vencimiento corto.

## Bloqueos que requieren aprobación humana

- Identificar y autorizar una instancia Supabase de `dev` para aplicar las migraciones.
- Aprobar el modelo de retención y acceso a evidencias, ubicación y auditoría.
- Aprobar proveedores de identidad, dominios, hosting y canales externos.
- Decidir la estrategia de migración de datos V1 cuando se conozca el esquema remoto real.

## Criterio de salida de Fase 0

La fase está **parcialmente completada**: el contrato local de ambientes y los criterios de seguridad están versionados. No puede declararse completada hasta que exista autorización para inventariar y validar una instancia `dev` aislada.
