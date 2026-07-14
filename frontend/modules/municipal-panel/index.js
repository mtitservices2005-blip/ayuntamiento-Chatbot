export const moduleId = 'municipal-panel';

export function mount(container, context = {}) {
  if (!container) {
    throw new Error('A mount container is required for municipal-panel.');
  }
  container.dataset.v2Module = moduleId;
  container.textContent = context.placeholder ?? 'Módulo V2: municipal-panel';
}
