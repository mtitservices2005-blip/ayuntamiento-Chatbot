# Portal Público V2

Portada pública navegable para Chatbot Municipal V2, preparada para GitHub Pages en `frontend/public-portal/index.html`.

## Alcance

- Entrada visual mobile-first para ciudadanía, administración y brigadas.
- Integra por enlaces los módulos existentes sin duplicar su lógica:
  - Citizen Portal V2: `../modules/citizen-portal/demo.html`
  - Institutional Content: `../modules/institutional-content/demo.html`
  - Authentication V2: `../auth/login.html`
  - Municipal Panel: `../modules/municipal-panel/demo.html`
  - Brigade Portal: `../modules/brigade-portal/demo.html`
- Mantiene todos los datos no oficiales marcados como `demo`.

## Uso local

Abrir directamente `frontend/public-portal/index.html` o servir el repositorio con un servidor estático.

```bash
python3 -m http.server 8080
```

Luego visitar `http://localhost:8080/frontend/public-portal/`.

## Notas operativas

- No usa secretos ni servicios externos.
- No reemplaza ni modifica la lógica del chatbot V1.
- Los datos institucionales deben validarse con fuentes oficiales antes de producción.
