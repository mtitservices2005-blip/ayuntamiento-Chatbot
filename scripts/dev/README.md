# Validación Supabase dev

Estos scripts crean y reutilizan exclusivamente usuarios, instituciones, brigadas y tickets sintéticos con el prefijo `saibot-dev-<sufijo>`. No borran datos.

## Requisitos

- Node.js 18 o superior (usa `fetch` nativo).
- Proyecto Supabase **dev** enlazado y migraciones `001`–`005` aplicadas.
- Buckets privados `ticket-evidence-v11` y `resolution-evidence-v11` creados.
- Variables de entorno locales, nunca archivadas: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SAIBOT_DEV_TEST_PASSWORD` (mínimo 16 caracteres).

## Ejecución

```powershell
$env:SAIBOT_DEV_TEST_SUFFIX = '001'
$env:SAIBOT_TARGET_ENV = 'dev'
node scripts/dev/seed-v11.mjs
node scripts/dev/validate-v11.mjs
```

El service role solo se usa para crear/reutilizar datos sintéticos y para lecturas de comprobación. Todas las pruebas de autorización usan JWT de usuarios sintéticos y la anon key. La salida no imprime secretos ni tokens.

## Límites

- No hay modo `--reset`: evita eliminar usuarios o tickets aunque sean sintéticos.
- Si el sufijo ya existe, el seed reutiliza usuarios y entidades compatibles.
- La prueba Storage verifica que una brigada A no pueda cargar en ruta de ticket B; requiere que el bucket exista.
