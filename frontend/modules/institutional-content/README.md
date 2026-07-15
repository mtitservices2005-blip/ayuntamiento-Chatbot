# Contenido institucional V2

Módulo demo multiinstitución para `Conoce tu municipio`: historia, lugares emblemáticos, alcalde, vicealcaldesa y concejo municipal.

Todos los textos iniciales están marcados como **Datos demo · no producción**. No contienen nombres, biografías, períodos ni fotografías reales.

## Uso

```js
import { mount } from './index.js';
mount(container, { institutionalContent });
```

Abrir demo local:

```bash
python3 -m http.server 8080
# visitar http://localhost:8080/frontend/modules/institutional-content/demo.html
```

## Contrato frontend preparado

Campos esperados por registro futuro: `institution_id`, `section_type`, `title`, `slug`, `summary`, `content`, `image_url`, `gallery`, `metadata`, `display_order`, `is_active`, `published_at`.

No crea tablas, no ejecuta migraciones y no modifica Supabase remoto.
