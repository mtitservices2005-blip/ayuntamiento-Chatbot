import { login, detectRole } from '../../shared/auth/session.js';
import { redirectByRole } from '../../shared/auth/guards.js';
import { getRoleLabel } from '../../shared/auth/roles.js';

const DEMO_PASSWORD = 'demo1234';
const elements = {};

function byId(id) { return document.getElementById(id); }

function setLoading(isLoading) {
  elements.submit.disabled = isLoading;
  elements.submit.innerHTML = isLoading ? '<span class="auth-spinner" aria-hidden="true"></span> Validando...' : 'Iniciar sesión';
}

function setMessage(text, type = 'info') {
  elements.message.textContent = text;
  elements.message.className = `auth-message ${type === 'error' ? 'is-error' : type === 'success' ? 'is-success' : ''}`.trim();
}

function getDemoRole(email) {
  if (email.includes('superadmin')) return 'mt_superadmin';
  if (email.includes('supervisor')) return 'supervisor';
  if (email.includes('brigada')) return 'brigade_member';
  return 'municipal_admin';
}

async function demoLogin(email, password) {
  await new Promise((resolve) => setTimeout(resolve, 850));
  if (password !== DEMO_PASSWORD || email.includes('error')) {
    throw new Error('Credenciales demo inválidas. Usa demo1234 o evita correos con "error".');
  }

  const role = getDemoRole(email);
  return {
    session: {
      user: {
        email,
        app_metadata: { role },
        user_metadata: { name: 'Usuario demo CM-002' },
      },
    },
  };
}

async function handleSubmit(event) {
  event.preventDefault();
  const email = elements.email.value.trim();
  const password = elements.password.value;
  const isDemo = elements.demo.checked;

  if (!email || !password) {
    setMessage('Ingresa email y contraseña para continuar.', 'error');
    return;
  }

  setLoading(true);
  setMessage(isDemo ? 'Modo demo activo: simulando autenticación segura...' : 'Validando credenciales con Supabase Auth...');

  try {
    const data = isDemo ? await demoLogin(email, password) : await login({ email, password });
    const session = data.session || data;
    const role = detectRole(session);
    const target = redirectByRole(role, { simulate: isDemo });
    setMessage(`Login exitoso. Rol: ${getRoleLabel(role)}. ${isDemo ? `Redirección simulada: ${target}` : 'Redirigiendo...'}`, 'success');

    if (!isDemo) redirectByRole(role);
  } catch (error) {
    setMessage(error.message || 'No fue posible iniciar sesión.', 'error');
  } finally {
    setLoading(false);
  }
}

function bindPasswordToggle() {
  elements.toggle.addEventListener('click', () => {
    const showing = elements.password.type === 'text';
    elements.password.type = showing ? 'password' : 'text';
    elements.toggle.textContent = showing ? 'Mostrar' : 'Ocultar';
    elements.toggle.setAttribute('aria-pressed', String(!showing));
  });
}

export function initLoginPage() {
  elements.form = byId('auth-login-form');
  elements.email = byId('auth-email');
  elements.password = byId('auth-password');
  elements.toggle = byId('auth-password-toggle');
  elements.submit = byId('auth-submit');
  elements.message = byId('auth-message');
  elements.demo = byId('auth-demo-mode');

  if (!elements.form) return;
  bindPasswordToggle();
  elements.form.addEventListener('submit', handleSubmit);
  setMessage('Listo para iniciar sesión. Activa el modo demo si aún no hay usuarios reales.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoginPage);
} else {
  initLoginPage();
}
