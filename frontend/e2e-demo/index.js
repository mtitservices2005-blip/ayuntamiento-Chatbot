const steps = [
  { actor: 'Ciudadano', status: 'received', integration: 'REAL NOT VERIFIED', action: 'Crear reporte ciudadano', contract: 'v11_create_citizen_ticket', description: 'RPC confirmada crea ticket y devuelve public_id + tracking_secret cuando exista Supabase autorizado.' },
  { actor: 'Ayuntamiento', status: 'received', integration: 'REAL NOT VERIFIED', action: 'Consultar bandeja municipal', contract: 'v11_tickets bajo RLS', description: 'Panel municipal consulta tickets permitidos por membership e institución activa.' },
  { actor: 'Ayuntamiento', status: 'assigned', integration: 'REAL NOT VERIFIED', action: 'Asignar brigada', contract: 'v11_assign_ticket', description: 'Transición received → assigned con versionado optimista y rol municipal_admin/supervisor.' },
  { actor: 'Brigada', status: 'assigned', integration: 'PARTIAL', action: 'Consultar ticket asignado', contract: 'v11_tickets + v11_brigade_members', description: 'Lectura preparada; falta RPC específica para resolver brigada activa del usuario.' },
  { actor: 'Brigada', status: 'in_progress', integration: 'REAL NOT VERIFIED', action: 'Iniciar trabajo', contract: 'v11_start_ticket_work', description: 'Transición assigned → in_progress para integrante de la brigada asignada.' },
  { actor: 'Brigada', status: 'in_progress', integration: 'PARTIAL', action: 'Añadir evidencia', contract: 'resolution-evidence-v11 + v11_can_write_resolution_object', description: 'Carga autenticada preparada si bucket privado existe; evidencia ciudadana permanece bloqueada sin Edge Function.' },
  { actor: 'Brigada', status: 'pending_verification', integration: 'REAL NOT VERIFIED', action: 'Enviar a verificación', contract: 'v11_submit_ticket_resolution', description: 'Transición in_progress → pending_verification exige evidence_path seguro institución/ticket/resolution/archivo.' },
  { actor: 'Supervisor', status: 'in_progress', integration: 'REAL NOT VERIFIED', action: 'Devolver a brigada', contract: 'v11_review_ticket_resolution approve=false', description: 'Flujo de rechazo confirmado: pending_verification → in_progress con nota obligatoria.' },
  { actor: 'Brigada', status: 'pending_verification', integration: 'REAL NOT VERIFIED', action: 'Reenviar corrección', contract: 'v11_submit_ticket_resolution', description: 'Tras corregir, brigada vuelve a enviar evidencia de resolución a verificación.' },
  { actor: 'Supervisor', status: 'resolved', integration: 'REAL NOT VERIFIED', action: 'Aprobar resolución', contract: 'v11_review_ticket_resolution approve=true', description: 'Transición pending_verification → resolved por supervisor/admin autorizado.' },
  { actor: 'Ciudadano', status: 'resolved', integration: 'REAL NOT VERIFIED', action: 'Consultar estado final', contract: 'v11_get_citizen_ticket', description: 'Tracking usa public_id + tracking_secret y no debe revelar existencia ante credenciales inválidas.' },
];
let current = 0;
function badge(value) { return value.toLowerCase().replaceAll(' ', '-'); }
function render() {
  const step = steps[current];
  document.querySelector('[data-current-actor]').textContent = step.actor;
  document.querySelector('[data-current-status]').textContent = step.status;
  document.querySelector('[data-current-integration]').textContent = step.integration;
  document.querySelector('[data-next-action]').textContent = step.action;
  document.querySelector('[data-step-description]').textContent = `${step.description} Contrato: ${step.contract}.`;
  document.querySelector('[data-folio]').textContent = current === 0 ? 'Se genera por v11_create_citizen_ticket' : 'Folio demo: public_id UUID confirmado';
  document.querySelector('[data-secret]').textContent = current === 0 ? 'tracking_secret se entrega al ciudadano al crear ticket.' : 'tracking_secret requerido para consulta ciudadana; oculto en presentación.';
  document.querySelector('[data-timeline]').innerHTML = steps.map((item, index) => `<article class="step ${index < current ? 'done' : ''} ${index === current ? 'active' : ''}"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${item.action}</strong><small>${item.actor} · ${item.status}</small><em class="${badge(item.integration)}">${item.integration}</em><p>${item.contract}</p></div></article>`).join('');
}
document.addEventListener('click', (event) => {
  const action = event.target?.dataset?.action;
  if (action === 'next') current = Math.min(current + 1, steps.length - 1);
  if (action === 'prev') current = Math.max(current - 1, 0);
  if (action === 'reject') current = 7;
  if (action === 'reset') current = 0;
  if (action) render();
});
render();
