export function byId(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Elemento requerido no encontrado: ${id}`);
  return element;
}

export function clear(element) {
  element.replaceChildren();
}

export function text(tag, value, className = '') {
  const element = document.createElement(tag);
  element.textContent = value ?? '';
  if (className) element.className = className;
  return element;
}

export function showMessage(target, message, kind = 'info') {
  clear(target);
  target.append(text('p', message, `message message-${kind}`));
}

export function setBusy(button, busy) {
  button.disabled = busy;
  button.setAttribute('aria-busy', String(busy));
}
