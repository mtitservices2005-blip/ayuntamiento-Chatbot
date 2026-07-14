export const v2Navigation = [
  { id: 'citizen-portal', label: 'Ciudadanía', path: '/citizen', roles: ['anonymous', 'citizen'] },
  { id: 'municipal-panel', label: 'Panel municipal', path: '/municipal', roles: ['municipal_admin', 'supervisor'] },
  { id: 'brigade-portal', label: 'Brigadas', path: '/brigade', roles: ['brigade_member'] },
  { id: 'master-admin', label: 'Master Admin', path: '/master', roles: ['mt_superadmin'] },
  { id: 'configuration', label: 'Configuración', path: '/configuration', roles: ['municipal_admin', 'mt_superadmin'] },
  { id: 'audit', label: 'Auditoría', path: '/audit', roles: ['auditor', 'mt_superadmin'] }
];

export function getNavigationForRole(role) {
  return v2Navigation.filter((item) => item.roles.includes(role));
}
