# CM-012 Pilot Readiness Report

Fecha: 2026-07-15. Resultado basado en inspección contractual CM-011, validación local y demo E2E controlada. No se ejecutaron pruebas contra Supabase remoto por ausencia de configuración pública autorizada.

| Pregunta | Respuesta | Explicación |
|---|---:|---|
| ¿Está lista la plataforma para demo visual? | YES | Existe una demo E2E unificada que explica el flujo completo, incluyendo devolución supervisor → brigada, con etiquetas claras REAL/REAL NOT VERIFIED/PARTIAL/DEMO/BLOCKED. |
| ¿Está lista para demo funcional local? | PARTIAL | Los módulos V2 y la demo local cargan sin backend, pero el flujo local no persiste en Supabase ni prueba RLS real. |
| ¿Está lista para pruebas con Supabase real? | PARTIAL | Los contratos principales de tickets están confirmados, pero se requiere proyecto autorizado, variables públicas, usuarios, memberships, brigadas, buckets privados y datos piloto. |
| ¿Está lista para piloto controlado? | PARTIAL | Puede iniciar piloto controlado solo después de completar checklist de activación, especialmente evidencia, buckets y usuarios/memberships. |
| ¿Está lista para producción? | NO | Faltan pruebas reales E2E, evidencia ciudadana segura, operación administrativa, monitoreo, notificaciones reales aprobadas y validación de infraestructura. |

## Estado real del flujo

- El ciclo de estados confirmado es `received -> assigned -> in_progress -> pending_verification -> resolved`.
- La devolución confirmada es `pending_verification -> in_progress` con nota obligatoria.
- No existe transición directa brigada → `resolved`; no se implementó ni documentó como real.
- Ciudadano consulta estado con `public_id` + `tracking_secret` mediante RPC confirmada.
- Evidencia de resolución es parcial hasta confirmar bucket privado real.
- Evidencia ciudadana está bloqueada sin Edge Function o contrato equivalente.

## Recomendación concreta

Siguiente paso recomendado: activar un entorno Supabase piloto no productivo con variables públicas autorizadas, buckets privados, institución, tres usuarios de prueba (`municipal_admin`, `supervisor`, `brigade_member`), brigada y runbook de prueba E2E no destructiva. Después, ejecutar la matriz CM-012 y actualizar estados `REAL_NOT_RUN` a `REAL_VERIFIED` solo con evidencia real.
