# CM-002 — Autenticación y resultado visual

## Arquitectura

CM-002 agrega un primer flujo visual de autenticación V2 sin modificar las pantallas V1 (`index.html`, `admin.html`, `brigada.html`). La implementación está separada en:

- `frontend/auth/login.html`: pantalla profesional y responsive de inicio de sesión.
- `frontend/auth/login.css`: estilos compartidos para login y demo visual.
- `frontend/auth/login.js`: comportamiento del formulario, modo demo, estado de carga, errores y redirección simulada.
- `frontend/auth/demo.html`: laboratorio visual para QA sin usuarios reales.
- `shared/auth/session.js`: inicialización de Supabase Auth, login, logout, obtención de sesión y detección de rol.
- `shared/auth/guards.js`: protección de rutas y redirección según rol.
- `shared/auth/roles.js`: catálogo de roles soportados, etiquetas y rutas destino.

## Variables necesarias

El frontend debe recibir solo valores públicos de Supabase:

```html
<script>
  window.SAIBOT_SUPABASE_URL = 'https://PROJECT.supabase.co';
  window.SAIBOT_SUPABASE_ANON_KEY = 'SUPABASE_ANON_PUBLIC_KEY';
</script>
```

No se debe exponer `service_role`, llaves privadas ni secretos en archivos servidos al navegador. Para producción, estos valores deben inyectarse desde el mecanismo de despliegue o un archivo de configuración público controlado, documentado por ambiente y excluyendo cualquier secreto.

## Flujo de sesión

1. El usuario abre `frontend/auth/login.html`.
2. El formulario captura email y contraseña.
3. Si el modo demo está activo, se simula autenticación con contraseña `demo1234`.
4. Si el modo demo está desactivado, `login()` llama a `supabase.auth.signInWithPassword()`.
5. `detectRole()` obtiene el rol desde `app_metadata.role`, `user_metadata.role`, `roles[0]` o `user.role`.
6. `redirectByRole()` mapea el rol al destino correspondiente.
7. `protectRoute()` valida sesión y roles permitidos para futuras pantallas privadas.

## Roles y redirecciones

| Rol | Destino funcional | Ruta V2 inicial |
| --- | --- | --- |
| `mt_superadmin` | Master Admin | `/frontend/modules/master-admin/` |
| `municipal_admin` | Municipal Panel | `/frontend/modules/municipal-panel/` |
| `supervisor` | Municipal Panel | `/frontend/modules/municipal-panel/` |
| `brigade_member` | Brigade Portal | `/frontend/modules/brigade-portal/` |

## Cómo abrir la demo visual

Desde la raíz del repositorio, sirve archivos estáticos y abre:

```bash
python3 -m http.server 8080
```

- Login visual: `http://localhost:8080/frontend/auth/login.html`
- Demo de estados: `http://localhost:8080/frontend/auth/demo.html`

En `login.html`, el modo demo está activo por defecto y acepta la contraseña `demo1234`. Correos que contengan `superadmin`, `supervisor` o `brigada` simulan esos roles; cualquier otro correo exitoso simula `municipal_admin`. Correos con `error` fuerzan error de credenciales.

## Qué falta para producción

- Definir el archivo o inyector de configuración pública por ambiente.
- Conectar pantallas reales de Master Admin, Municipal Panel y Brigade Portal.
- Confirmar el origen canónico del rol en Supabase (`app_metadata.role` recomendado).
- Agregar recuperación de contraseña real con `supabase.auth.resetPasswordForEmail()`.
- Crear pruebas automatizadas de navegador cuando exista pipeline V2.
- Asegurar políticas RLS y claims de usuario para cada municipio antes de habilitar operación real.
