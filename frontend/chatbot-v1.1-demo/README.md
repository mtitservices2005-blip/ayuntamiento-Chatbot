# Demo conversacional V1.1

Demo web estática que simula la futura experiencia de WhatsApp del Chatbot Municipal V1.1 sin conectar Meta ni modificar producción.

## Cómo abrirla

Desde la raíz del repositorio:

```bash
python3 -m http.server 4173
```

Luego abrir:

```text
http://localhost:4173/frontend/chatbot-v1.1-demo/
```

## Incluye

- Menú principal conversacional con burbujas y respuestas rápidas.
- Reportar incidencia y consultar ticket en modo demo.
- Historia, lugares emblemáticos, contactos y horarios configurables.
- Secciones “Conoce al alcalde” y “Conoce a la vicealcaldesa” con placeholders oficiales pendientes.
- Uso de contratos independientes del canal para futura integración con WhatsApp Business Platform.
