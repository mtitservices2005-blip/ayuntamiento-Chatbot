import { detectRole, getSession } from './session.js';
import { getRoleRedirect, isSupportedRole } from './roles.js';

export function redirectByRole(role, options = {}) {
  const target = getRoleRedirect(role);
  if (!target) return null;

  if (options.simulate) return target;
  const locationRef = options.location || globalThis.location;
  if (locationRef?.assign) locationRef.assign(target);
  else if (locationRef) locationRef.href = target;
  return target;
}

export async function protectRoute(options = {}) {
  const {
    allowedRoles = [],
    loginPath = '/frontend/auth/login.html',
    location: locationRef = globalThis.location,
  } = options;

  const session = await getSession();
  if (!session) {
    if (locationRef?.assign) locationRef.assign(loginPath);
    return { allowed: false, reason: 'missing_session', role: null };
  }

  const role = detectRole(session);
  if (!isSupportedRole(role)) {
    return { allowed: false, reason: 'unsupported_role', role };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return { allowed: false, reason: 'forbidden_role', role, redirectTo: getRoleRedirect(role) };
  }

  return { allowed: true, reason: 'ok', role };
}
