# Plan de migración V1/V1.1 a V2

## Principios

- No modificar producción ni desplegar sin aprobación humana explícita.
- No tocar secretos ni copiar credenciales a documentación.
- Mantener V1/V1.1 operativa hasta que cada módulo V2 tenga equivalencia, pruebas y rollback.
- Migrar primero contratos y seguridad; después interfaces.

## Etapas

1. **Inventario y baseline**: congelar alcance de V1/V1.1, tablas, buckets, RPC, roles y flujos críticos en ambiente dev.
2. **Shell V2**: implementar navegación común, carga dinámica, layout por rol y validación de manifiestos.
3. **Backend/BFF**: mover operaciones sensibles a server-side y dejar al frontend como consumidor de contratos.
4. **Módulos por dominio**: migrar Citizen Portal, Municipal Panel, Brigade Portal y Master Admin de forma independiente.
5. **Transversales**: integrar Configuration, Authentication, Notifications, Audit y Storage.
6. **Pruebas de convivencia**: comparar salidas V1.1/V2 en dev, con pruebas positivas y negativas por institución.
7. **Corte controlado**: habilitar V2 por feature flag e institución; mantener rollback probado.

## Criterios de salida

- Todas las rutas V2 tienen pruebas automatizadas mínimas.
- Las transiciones de tickets se auditan con actor, institución, objeto, acción, fecha y contexto.
- Storage no expone rutas públicas permanentes de evidencias sensibles.
- No existen secretos en frontend ni commits.
- Hay aprobación humana para cualquier cambio de esquema, RLS, buckets, dominios, hosting o producción.

## Rollback

- Desactivar feature flag V2 por institución.
- Restaurar rutas V1.1 sin cambiar datos.
- Revisar auditoría e incidentes antes de reintentar.
