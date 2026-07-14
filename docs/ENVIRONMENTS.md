# Ambientes y promoción de V1.1

## Estado de este repositorio

Este repositorio no identifica de forma verificable una instancia Supabase de desarrollo, staging o producción. Por tanto, los archivos en `supabase/` son artefactos versionados que **no han sido aplicados** a ningún proyecto remoto.

## Separación requerida

| Ambiente | Propósito | Datos permitidos | Promoción |
| --- | --- | --- | --- |
| `dev` | Desarrollo y pruebas automatizadas. | Datos sintéticos únicamente. | Cambios locales y migraciones revisadas. |
| `staging` | Validación integrada y piloto controlado. | Datos anonimizados o sintéticos aprobados. | Desde `dev`, con revisión técnica. |
| `prod` | Operación municipal real. | Datos reales conforme a política aprobada. | Desde `staging`, con aprobación humana explícita. |

Cada ambiente debe usar un proyecto Supabase, buckets, usuarios de servicio, dominios y secretos independientes. Nunca se deben reutilizar claves de producción en `dev` o `staging`.

## Configuración pública del navegador

El cliente V1.1 solo acepta los siguientes valores públicos por ambiente:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `APP_ENV` (`dev`, `staging` o `prod`)

No se permite colocar una `service_role`, tokens de integración, claves de webhook ni secretos operativos en archivos servidos al navegador. La configuración real debe inyectarse durante el despliegue o residir en un archivo local ignorado por Git.

## Promoción y reversión

1. Revisar la migración, políticas RLS y pruebas en `dev`.
2. Aplicar una migración nueva, inmutable y con identificador temporal; nunca editar una migración ya aplicada.
3. Ejecutar la matriz de pruebas de autorización y aislamiento.
4. Promover a `staging` con una copia de seguridad y un plan de reversión aprobado.
5. Promover a `prod` solo con autorización humana, ventana de cambio y responsable de reversión.

La reversión se implementa mediante una migración nueva y aprobada. No se permiten comandos destructivos ni restauraciones improvisadas contra datos reales.

## Bloqueos actuales

- Falta confirmación de qué proyecto corresponde a `dev` y quién autoriza migraciones.
- No se dispone de cuentas de prueba por rol ni dominio de staging.
- No hay política aprobada de clasificación/retención de tickets, fotos y coordenadas.

Hasta resolver estos puntos, el trabajo se limita a diseño, migraciones y pruebas locales versionadas.
