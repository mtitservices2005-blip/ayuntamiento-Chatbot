export const moduleId = 'master-admin';

export function mount(container, context = {}) {
  if (!container) {
    throw new Error('A mount container is required for master-admin.');
  }
  container.dataset.v2Module = moduleId;
  container.textContent = context.placeholder ?? 'Módulo V2: master-admin';
}
