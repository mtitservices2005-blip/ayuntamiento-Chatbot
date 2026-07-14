# Informe de validación Supabase dev

Fecha: 2026-07-14  
Alcance: preparación y validación local de los artefactos V1.1. No se ejecutaron mutaciones remotas durante esta misión.

## Estado de ejecución

| Grupo | Estado | Resultado |
| --- | --- | --- |
| Revisión de migraciones 001–005 | Aprobada estáticamente | Se confirmaron tenancy, RLS, RPC, auditoría, Storage y contratos de integración. |
| Corrección `extensions.crypt` | Preparada y versionada | La consulta ciudadana referencia explícitamente la extensión de Supabase. |
| Scripts de usuarios y seed | Aprobados estáticamente | `scripts/dev/seed-v11.mjs` usa solo nombres `saibot-dev-<sufijo>` y no elimina datos. |
| Pruebas de roles/aislamiento/flujo | Aprobadas estáticamente | `scripts/dev/validate-v11.mjs` cubre perfiles, aislamiento A/B, denegaciones, ciudadano, estados, auditoría y Storage. |
| Ejecución integrada contra dev | Bloqueada | Esta estación no tiene Node, CLI Supabase, PostgreSQL ni variables de entorno dev requeridas. |

## Guardas de seguridad

- Los scripts abortan salvo que `SAIBOT_TARGET_ENV=dev`.
- Las credenciales solo se leen desde variables de entorno locales; no se guardan ni se imprimen.
- No existe modo de reset o borrado.
- La carga usada durante la prueba de resolución contiene únicamente bytes de imagen sintéticos y una ruta de ticket sintético.
- `supabase/.temp/` está ignorado para impedir incluir metadatos locales de enlace.

## Ejecución pendiente en una estación autorizada

```powershell
$env:SAIBOT_TARGET_ENV = 'dev'
$env:SAIBOT_DEV_TEST_SUFFIX = '001'
# Establecer SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY y SAIBOT_DEV_TEST_PASSWORD fuera del repositorio.
node scripts/dev/seed-v11.mjs
node scripts/dev/validate-v11.mjs
```

La salida esperada del validador es `status: passed`. Cualquier fallo debe conservarse como evidencia redactada y corregirse mediante una migración nueva o un commit local seguro; no se deben editar migraciones ya aplicadas en el entorno remoto.
