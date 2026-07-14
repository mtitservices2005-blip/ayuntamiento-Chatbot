# Roadmap V2 — Chatbot Municipal

## Fase 1 — Foundation completada en esta misión

- Revisar arquitectura V1/V1.1 y documentar brechas contra MTIT-OS / SAIBOT.
- Crear estructura `/frontend`, `/backend`, `/shared`, `/docs` y `/tests`.
- Separar módulos funcionales y transversales.
- Crear navegación común y loader dinámico fundacional.
- Documentar arquitectura, roadmap y migración.

## Fase 2 — Shell y contratos ejecutables

- Seleccionar stack de frontend V2, router, empaquetador, pruebas y lint.
- Crear application shell con layouts por rol.
- Validar manifiestos contra `shared/contracts/module-manifest.schema.json`.
- Agregar pruebas de navegación por rol y carga dinámica.

## Fase 3 — Backend/BFF y seguridad multiinstitución

- Implementar capa server-side para tickets, transiciones, storage y auditoría.
- Definir contratos API versionados.
- Validar RLS, claims, políticas de buckets y pruebas negativas por rol.
- Eliminar dependencias directas de páginas contra tablas cuando exista reemplazo seguro.

## Fase 4 — Migración funcional V1.1 a V2

- Migrar Citizen Portal, Municipal Panel, Brigade Portal y Master Admin por módulos.
- Sustituir hardcodes por Configuration.
- Conectar Audit, Notifications y Storage con colas/adaptadores.
- Mantener rollback a V1.1 hasta validación operativa.

## Fase 5 — Producción controlada

- Preparar CI/CD, ambientes, monitoreo, alertas y runbooks.
- Ejecutar pruebas de seguridad y privacidad.
- Habilitar despliegue progresivo por institución con aprobación humana.
