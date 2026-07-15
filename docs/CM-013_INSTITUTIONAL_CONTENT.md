# CM-013 — Contenido institucional y autoridades municipales

## Arquitectura

Se crea `frontend/modules/institutional-content/` como módulo V2 montable con `mount(container, context)`. El Portal Ciudadano V2 enlaza de forma visible a **Conoce tu municipio** sin alterar creación, consulta ni seguimiento de tickets.

## Estructura de datos demo

El frontend usa datos locales con `institution_id`, historia, lugares, autoridades y concejo. Todos los valores aparecen como **Datos demo · no producción** y deben reemplazarse por información oficial aprobada.

Contrato futuro sugerido por registro: `institution_id`, `section_type`, `title`, `slug`, `summary`, `content`, `image_url`, `gallery`, `metadata`, `display_order`, `is_active`, `published_at`.

## Cargar contenido oficial

1. Validar nombres, cargos, períodos y biografías con la institución.
2. Registrar fuentes para historia, fecha de creación, origen del nombre y evolución territorial.
3. Cargar fotos autorizadas en Storage cuando exista contrato backend seguro.
4. Publicar por versión con auditoría y aprobación municipal.

## Sustituir fotografías

Usar `image_url` por perfil o lugar cuando exista Storage multiinstitución con RLS. Mientras tanto se muestran placeholders profesionales accesibles.

## Configurar otro municipio

Pasar `context.institutionalContent` a `mount()` con `municipalityName`, `managementPeriod`, `history`, `places`, `authorities` y `council`. No es necesario editar código para cambiar listas.

## Límites actuales

No hay persistencia real, Storage, auditoría, SEO, versiones ni publicación productiva. No se crearon tablas ni migraciones y no se modificó Supabase remoto.

## Backend futuro necesario

Se requiere contrato para Institutions, Institution settings, Storage, RLS multiinstitución, Configuration V2, Master Admin V2, auditoría, publicación por versiones, SEO y metadatos sociales.

## Checklist de aprobación

- Datos oficiales recibidos y validados.
- Fotografías autorizadas.
- Biografías aprobadas por cada autoridad.
- Historia respaldada por fuentes.
- Revisión legal/comunicaciones.
- Vista previa aprobada antes de publicar.
