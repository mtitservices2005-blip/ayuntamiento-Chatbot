export const moduleId = 'storage';

export function mount(container, context = {}) {
  if (!container) {
    throw new Error('A mount container is required for storage.');
  }
  container.dataset.v2Module = moduleId;
  container.textContent = context.placeholder ?? 'Módulo V2: storage';
}
