export const moduleId = 'citizen-portal';

export function mount(container, context = {}) {
  if (!container) {
    throw new Error('A mount container is required for citizen-portal.');
  }
  container.dataset.v2Module = moduleId;
  container.textContent = context.placeholder ?? 'Módulo V2: citizen-portal';
}
