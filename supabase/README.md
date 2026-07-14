# Supabase V1.1 (artefactos locales)

Las migraciones de esta carpeta describen una instalación nueva de V1.1. No se han aplicado a ningún proyecto remoto.

## Aplicación autorizada

1. Confirmar por escrito que el proyecto objetivo es `dev` y contiene solo datos sintéticos.
2. Revisar el esquema legado y definir una migración de datos aparte; estas migraciones no modifican `tickets` ni `brigadas` de V1.
3. Aplicar las migraciones con la CLI/flujo aprobado de Supabase.
4. Crear de forma manual los buckets privados `ticket-evidence-v11` y `resolution-evidence-v11` antes de aplicar las políticas Storage.
5. Ejecutar `supabase/tests/SECURITY_TEST_PLAN.md` con usuarios de prueba de las dos instituciones.

No ejecutar contra producción sin aprobación humana, respaldo y plan de reversión.
