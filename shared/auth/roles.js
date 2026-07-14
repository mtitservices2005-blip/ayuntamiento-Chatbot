export const AUTH_ROLES = Object.freeze({
  MT_SUPERADMIN: 'mt_superadmin',
  MUNICIPAL_ADMIN: 'municipal_admin',
  SUPERVISOR: 'supervisor',
  BRIGADE_MEMBER: 'brigade_member',
});

export const ROLE_LABELS = Object.freeze({
  [AUTH_ROLES.MT_SUPERADMIN]: 'Master Admin',
  [AUTH_ROLES.MUNICIPAL_ADMIN]: 'Municipal Panel',
  [AUTH_ROLES.SUPERVISOR]: 'Municipal Panel',
  [AUTH_ROLES.BRIGADE_MEMBER]: 'Brigade Portal',
});

export const ROLE_REDIRECTS = Object.freeze({
  [AUTH_ROLES.MT_SUPERADMIN]: '/frontend/modules/master-admin/',
  [AUTH_ROLES.MUNICIPAL_ADMIN]: '/frontend/modules/municipal-panel/',
  [AUTH_ROLES.SUPERVISOR]: '/frontend/modules/municipal-panel/',
  [AUTH_ROLES.BRIGADE_MEMBER]: '/frontend/modules/brigade-portal/',
});

export function normalizeRole(role) {
  return typeof role === 'string' ? role.trim().toLowerCase() : null;
}

export function isSupportedRole(role) {
  return Object.values(AUTH_ROLES).includes(normalizeRole(role));
}

export function getRoleRedirect(role) {
  return ROLE_REDIRECTS[normalizeRole(role)] || null;
}

export function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)] || 'Sin rol asignado';
}
