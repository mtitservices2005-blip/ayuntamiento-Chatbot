# Portal de Brigadas V2

Demo visual mobile-first para brigadas municipales en campo. Todos los folios, estados, evidencias y métricas son **Datos demo · no producción**.

## Cómo abrir la demo

Desde la raíz del repositorio:

```bash
python3 -m http.server 4173
```

Luego abrir en el navegador:

```text
http://localhost:4173/frontend/modules/brigade-portal/demo.html
```

## Alcance demo

- Dashboard de brigada con miembros, estado operativo, conexión y KPIs.
- Lista de tickets asignados con buscador y filtros por estado, prioridad y categoría.
- Detalle navegable con timeline, comentarios, evidencia demo y acciones táctiles.
- Flujo visual funcional `assigned → in_progress → pending_verification` sin persistencia real.
- Selector de imagen con vista previa local y comentario de resolución obligatorio para enviar a verificación.
- Mapa/ruta placeholder sin API keys ni servicios externos.
- Indicador online/offline y cola demo de sincronización pendiente.

## Integración futura

El módulo deja puntos explícitos para Supabase Auth, RLS multiinstitución, Tickets V1.1, Storage, Realtime, GPS, auditoría y notificaciones. No incluye secretos ni usa `service_role` en frontend.
