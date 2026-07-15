# Frontend V2 + demo conversacional V1.1

Base modular para portales de Chatbot Municipal V2. Las páginas no deben depender entre sí; deben usar navegación común, contratos compartidos y carga dinámica por manifiesto.

## Separación de experiencias

- La experiencia ciudadana principal de V1.1 se conserva como flujo conversacional, pensado para una futura ejecución en WhatsApp.
- La plataforma web V2 se mantiene como sistema interno y operativo: Municipal Panel, Brigade Portal, Master Admin, Configuration, Notifications, Audit, Storage y demos V2.
- La demo `chatbot-v1.1-demo/` permite validar el menú conversacional, autoridades, historia, lugares, reporte y consulta de ticket sin conectar Meta ni modificar producción.

## Configuración reutilizable

- `shared/municipal-config.js` centraliza autoridades, historia, lugares emblemáticos, contactos y branding con placeholders marcados como pendientes hasta recibir información oficial.
- `shared/contracts/channel-contracts.js` define contratos independientes del canal para mapear la conversación a web demo o WhatsApp Business Platform en el futuro.
