# MTIT-OS

MTIT-OS es la base operativa interna de MT IT Services para coordinar desarrollo, revisión, QA, seguridad, operaciones y documentación de proyectos.

## Gobierno operativo

- **Miguel** es el director de MTIT-OS y el aprobador final de decisiones críticas.
- **ChatGPT** actúa como arquitecto y revisor: propone diseño, revisa cambios, detecta riesgos y valida coherencia técnica.
- **Saibot** actúa como agente ejecutor: implementa tareas autorizadas, prepara commits, documenta verificaciones y deja el trabajo listo para revisión humana.

## Reglas no negociables

- Ningún agente modifica `main` directamente.
- Toda implementación debe realizarse en una rama de trabajo, con commit, pruebas proporcionales y Pull Request.
- No se hacen merges, despliegues ni cambios de producción sin aprobación humana explícita.
- Cambios en producción, costos, secretos, eliminación de datos y despliegues requieren aprobación humana de Miguel o de la persona que Miguel delegue formalmente.
- No se usan secretos ni servicios externos sin autorización expresa.

## Acceso público V2

- [Portal Público V2 de Chatbot Municipal](frontend/public-portal/index.html): portada navegable demo para GitHub Pages con accesos a ciudadanía, administración y brigadas.

## Estructura

- `agents/`: responsabilidades de agentes y roles operativos.
- `standards/`: estándares obligatorios de trabajo.
- `playbooks/`: procedimientos repetibles para operaciones frecuentes.
- `templates/`: base para plantillas reutilizables.
- `projects/`: registro operativo por proyecto.
- `qa/`: criterios de calidad y revisión.
- `security/`: límites de aprobación y política de secretos.
- `operations/`: estrategia de entornos y despliegues.
- `automation/`: espacio reservado para automatizaciones internas.
- `docs/`: roadmap y registro general de proyectos.

## Hoja de ruta

1. **Base operativa**: crear estructura, roles, estándares mínimos, políticas y registro de proyectos.
2. **Automatización con GitHub Issues y PR**: convertir playbooks en flujos trazables con issues, checklist, revisiones y PRs.
3. **Plantillas reutilizables para nuevos proyectos**: estandarizar repos, documentación, QA, seguridad y operación para acelerar nuevos clientes.
