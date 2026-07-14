# Interfaz V1.1

Esta carpeta es una superficie nueva y modular. No modifica `index.html`, `admin.html` ni `brigada.html` de V1.

## Páginas

- `index.html?institution=<slug>`: portal ciudadano y seguimiento con secreto de alta entropía.
- `admin.html`: panel para `municipal_admin` y `supervisor`.
- `brigade.html`: panel para `brigade_member`; los datos se restringen por RLS a su brigada.
- `master.html`: base del Panel Maestro, restringida a `mt_superadmin`.

## Configuración local

1. Copiar `js/config.example.js` a `js/config.local.js`.
2. Usar exclusivamente URL y anon key de un proyecto `dev` autorizado.
3. Servir esta carpeta mediante un servidor local HTTPS/HTTP de desarrollo; no abrirla como `file:`.

`config.local.js` está ignorado por Git. La aplicación muestra un error seguro si no existe o es inválido.

## Límites conscientes

- Las acciones de transición están preparadas en RPC pero aún no se exponen en la interfaz hasta que sean verificadas contra un `dev` real.
- La carga de evidencia ciudadana está deshabilitada deliberadamente: requiere una Edge Function confiable que valide archivo y gestione rutas privadas.
- El CDN de Supabase está fijado a una versión exacta; la política CSP/SRI se configura en el hosting aprobado.
