export function getPublicConfig() {
  const config = window.SAIBOT_PUBLIC_CONFIG;
  if (!config || !config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('La configuración pública de este ambiente no está disponible.');
  }
  if (!['dev', 'staging', 'prod'].includes(config.appEnv)) {
    throw new Error('APP_ENV no es válido.');
  }
  return Object.freeze({ ...config });
}

export function getInstitutionSlug() {
  const slug = new URLSearchParams(window.location.search).get('institution');
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Indica una institución válida en el parámetro ?institution=.');
  }
  return slug;
}
