# Estado de pruebas V1.1

Fecha: 2026-07-14.

| Prueba | Estado | Evidencia / bloqueo |
| --- | --- | --- |
| Artefactos V1.1 y RLS | Aprobada localmente | Comprobación estática manual: archivos, tablas, RLS y ausencia de cambios V1. |
| Integridad de diff | Aprobada localmente | `git diff --check` sin salida. |
| Regresión V1 | Aprobada estáticamente | No se modificaron `index.html`, `admin.html` ni `brigada.html`. |
| Script `static_v11_contract.ps1` | No ejecutable localmente | Política local bloquea ejecución de scripts `.ps1`; el mismo contrato se ejecutó como comandos de solo lectura. CI lo ejecutará con PowerShell en runner. |
| Creación de institución | No ejecutada | Requiere Supabase `dev` y rol de superadministración de prueba. |
| Aislamiento A/B | No ejecutada | Requiere RLS aplicada y JWT sintéticos por institución. |
| Login y perfiles | No ejecutada | Requiere Auth `dev` y correo/usuarios de prueba. |
| Roles y permisos | No ejecutada | Requiere membresías sintéticas. |
| Brigada solo ve tickets propios | No ejecutada | Requiere datos A/B y RLS aplicada. |
| Creación/consulta ciudadana | No ejecutada | Requiere RPC aplicada y entorno `dev`; no se usarán datos reales. |
| Flujo de estados/auditoría | No ejecutada | Requiere RPC aplicada, usuarios por rol y datos sintéticos. |
| Evidencias Storage | No ejecutada | Requiere buckets privados `dev` y función de carga confiable. |
| Integración WhatsApp/SmartWaste | No ejecutada | No hay sandbox ni autorización para credenciales/comunicaciones. |

## Próxima ejecución necesaria

Aplicar las migraciones únicamente en un proyecto `dev` autorizado y ejecutar el plan `supabase/tests/SECURITY_TEST_PLAN.md`. Hasta entonces, V1.1 está **implementada como código y validada estáticamente**, pero no está integrada ni validada en seguridad de ejecución.
