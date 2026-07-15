export const moduleId = 'brigade-portal';

const DEMO_NOTICE = 'Datos demo · no producción';
const STATE_FLOW = ['assigned', 'in_progress', 'pending_verification'];
const STATE_LABELS = {
  assigned: 'Asignado',
  in_progress: 'En progreso',
  pending_verification: 'Pendiente de verificación',
  resolved: 'Resuelto',
};
const PRIORITY_LABELS = { alta: 'Alta', media: 'Media', baja: 'Baja', critica: 'Crítica' };

const demoTickets = [
  {
    id: 'T-001', folio: 'BRG-2026-0715-001', category: 'Alumbrado público', location: 'Av. Hidalgo y Calle 5',
    address: 'Av. Hidalgo 123, Centro, Saibot', coordinates: '19.4326, -99.1332', priority: 'alta', date: '2026-07-15 08:20',
    status: 'assigned', brigade: 'Brigada Alfa', description: 'Luminaria principal apagada frente a la parada de transporte. Zona con alto tránsito peatonal nocturno.',
    evidence: ['Foto ciudadana demo: luminaria apagada', 'Referencia visual demo: poste 14-B'],
    timeline: ['08:20 Ticket asignado a Brigada Alfa', '08:28 Supervisor confirmó prioridad alta'],
    comments: ['Priorizar por zona escolar cercana.'],
  },
  {
    id: 'T-002', folio: 'BRG-2026-0715-002', category: 'Bacheo', location: 'Calle Morelos 45',
    address: 'Calle Morelos 45, Col. Jardines, Saibot', coordinates: '19.4351, -99.1410', priority: 'critica', date: '2026-07-15 09:05',
    status: 'in_progress', brigade: 'Brigada Alfa', description: 'Bache profundo en carril derecho con riesgo para motociclistas y transporte público.',
    evidence: ['Foto demo de carpeta asfáltica dañada'], timeline: ['09:05 Ticket recibido', '09:30 Trabajo iniciado en campo'], comments: ['Se requiere señalización preventiva.'],
  },
  {
    id: 'T-003', folio: 'BRG-2026-0715-003', category: 'Limpieza urbana', location: 'Parque Las Flores',
    address: 'Parque Las Flores, acceso norte, Saibot', coordinates: '19.4288, -99.1304', priority: 'media', date: '2026-07-15 10:10',
    status: 'pending_verification', brigade: 'Brigada Alfa', description: 'Retiro de ramas y residuos reportados después de lluvia intensa.',
    evidence: ['Foto demo antes', 'Foto demo después'], timeline: ['10:10 Asignado', '10:40 Llegada marcada', '11:30 Enviado a verificación'], comments: ['Área despejada; pendiente validación municipal.'],
  },
  {
    id: 'T-004', folio: 'BRG-2026-0714-018', category: 'Agua y drenaje', location: 'Privada Reforma',
    address: 'Privada Reforma 8, Col. Norte, Saibot', coordinates: '19.4412, -99.1281', priority: 'baja', date: '2026-07-14 16:15',
    status: 'assigned', brigade: 'Brigada Alfa', description: 'Revisión de coladera parcialmente obstruida sin escurrimiento activo.',
    evidence: ['Imagen demo del reporte ciudadano'], timeline: ['16:15 Ticket reasignado a brigada de guardia'], comments: ['Puede atenderse en ruta secundaria.'],
  },
];

function cloneTickets() { return demoTickets.map((ticket) => ({ ...ticket, timeline: [...ticket.timeline], comments: [...ticket.comments], evidence: [...ticket.evidence] })); }
function statusClass(status) { return `status-${status.replace(/_/g, '-')}`; }
function countBy(tickets, status) { return tickets.filter((ticket) => ticket.status === status).length; }

export function createBrigadePortalState() {
  return { tickets: cloneTickets(), selectedId: 'T-001', query: '', status: 'all', priority: 'all', category: 'all', online: true, pendingSync: 0, evidencePreview: '', evidenceName: '', resolutionComment: '', notice: '' };
}

export function applyTicketFilters(tickets, filters) {
  const query = (filters.query || '').trim().toLowerCase();
  return tickets.filter((ticket) => {
    const haystack = `${ticket.folio} ${ticket.category} ${ticket.location} ${ticket.brigade}`.toLowerCase();
    return (!query || haystack.includes(query)) &&
      (filters.status === 'all' || ticket.status === filters.status) &&
      (filters.priority === 'all' || ticket.priority === filters.priority) &&
      (filters.category === 'all' || ticket.category === filters.category);
  });
}

export function advanceTicketStatus(ticket, action, hasEvidence = false) {
  if (action === 'start' && ticket.status === 'assigned') return 'in_progress';
  if (action === 'verify' && ticket.status === 'in_progress' && hasEvidence) return 'pending_verification';
  return ticket.status;
}

export function mount(container, context = {}) {
  if (!container) throw new Error('A mount container is required for brigade-portal.');
  const state = createBrigadePortalState();
  const brigadeName = context.brigadeName || 'Brigada Alfa';
  const members = context.members || ['María Torres · Jefa de cuadrilla', 'Luis Pérez · Técnico', 'Ana Ruiz · Operadora'];
  container.dataset.v2Module = moduleId;

  function selectedTicket() { return state.tickets.find((ticket) => ticket.id === state.selectedId) || state.tickets[0]; }
  function setTicketStatus(action) {
    const ticket = selectedTicket();
    const next = advanceTicketStatus(ticket, action, Boolean(state.evidencePreview || ticket.evidence.some((item) => item.includes('enviada'))));
    if (action === 'verify' && next === ticket.status) { state.notice = 'Agrega evidencia demo antes de enviar a verificación.'; return render(); }
    if (next !== ticket.status) { ticket.status = next; ticket.timeline.push(`${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} Estado actualizado a ${STATE_LABELS[next]} (demo)`); state.pendingSync += state.online ? 0 : 1; state.notice = 'Estado actualizado visualmente; no se persistió en Supabase.'; }
    render();
  }
  function render() {
    const categories = [...new Set(state.tickets.map((ticket) => ticket.category))];
    const filtered = applyTicketFilters(state.tickets, state);
    const ticket = selectedTicket();
    container.innerHTML = `
      <style>${styles}</style>
      <main class="brigade-shell">
        <section class="hero-card">
          <div><p class="demo-pill">${DEMO_NOTICE}</p><h1>Portal de Brigadas V2</h1><p>Interfaz mobile-first para cuadrillas en campo, sin conexión a producción.</p></div>
          <button class="connection ${state.online ? 'online' : 'offline'}" data-action="toggle-online">${state.online ? '● Online' : '● Offline demo'}</button>
        </section>
        <section class="offline-card ${state.online ? '' : 'is-offline'}"><strong>${state.online ? 'Conectividad disponible' : 'Sin conexión: modo campo demo'}</strong><span>Cola demo pendiente: ${state.pendingSync} acción(es). No hay persistencia offline real todavía.</span><button data-action="sync">Reintentar sincronización</button></section>
        <section class="summary-grid">
          ${metric('Brigada', brigadeName)}${metric('Miembros', members.length)}${metric('Estado operativo', state.online ? 'Disponible' : 'Limitado')}${metric('Asignados', countBy(state.tickets, 'assigned'))}${metric('En progreso', countBy(state.tickets, 'in_progress'))}${metric('Por verificar', countBy(state.tickets, 'pending_verification'))}${metric('Resueltos hoy', '0 demo')}
        </section>
        <section class="members-card"><h2>Equipo</h2>${members.map((member) => `<span>${member}</span>`).join('')}</section>
        <section class="workbench">
          <div class="ticket-list"><h2>Tickets asignados</h2><div class="filters"><input data-filter="query" placeholder="Buscar folio, ubicación..." value="${state.query}"><select data-filter="status">${option('all','Todos los estados',state.status)}${Object.entries(STATE_LABELS).map(([v,l])=>option(v,l,state.status)).join('')}</select><select data-filter="priority">${option('all','Todas las prioridades',state.priority)}${Object.entries(PRIORITY_LABELS).map(([v,l])=>option(v,l,state.priority)).join('')}</select><select data-filter="category">${option('all','Todas las categorías',state.category)}${categories.map((cat)=>option(cat,cat,state.category)).join('')}</select></div><div class="cards">${filtered.map(ticketCard).join('') || '<p class="empty">Sin tickets con esos filtros.</p>'}</div></div>
          <article class="detail"><p class="demo-pill">${DEMO_NOTICE}</p><h2>${ticket.folio}</h2><p>${ticket.description}</p><div class="detail-grid">${detail('Categoría', ticket.category)}${detail('Ubicación', ticket.location)}${detail('Prioridad', PRIORITY_LABELS[ticket.priority])}${detail('Estado actual', STATE_LABELS[ticket.status])}${detail('Creación', ticket.date)}${detail('Brigada', ticket.brigade)}</div><div class="map-card"><strong>Ubicación y ruta</strong><p>${ticket.address}</p><p>Coordenadas demo: ${ticket.coordinates}</p><button data-action="route">Abrir ruta</button></div><h3>Flujo visual</h3><div class="flow">${STATE_FLOW.map((s)=>`<span class="${STATE_FLOW.indexOf(s)<=STATE_FLOW.indexOf(ticket.status)?'done':''}">${STATE_LABELS[s]}</span>`).join('')}</div><div class="actions"><button data-action="start">Iniciar trabajo</button><button data-action="arrival">Marcar llegada</button><label class="upload">Subir evidencia<input type="file" accept="image/*" data-action="evidence"></label><button data-action="verify">Enviar a verificación</button></div><textarea data-action="comment" placeholder="Añadir comentario de resolución">${state.resolutionComment}</textarea>${state.evidencePreview ? `<img class="preview" src="${state.evidencePreview}" alt="Vista previa de evidencia demo"><p class="notice">Evidencia seleccionada: ${state.evidenceName}</p>` : ''}<h3>Evidencias demo</h3><ul>${ticket.evidence.map((item)=>`<li>${item}</li>`).join('')}</ul><h3>Timeline</h3><ol>${ticket.timeline.map((item)=>`<li>${item}</li>`).join('')}</ol><h3>Comentarios</h3><ul>${ticket.comments.map((item)=>`<li>${item}</li>`).join('')}</ul>${state.notice ? `<p class="notice">${state.notice}</p>` : ''}<footer>Preparado para futuras integraciones: Supabase Auth, RLS multiinstitución, Tickets V1.1, Storage, Realtime, GPS, auditoría y notificaciones. Sin secretos ni service_role en frontend.</footer></article>
        </section>
      </main>`;
  }
  function metric(label, value) { return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`; }
  function detail(label, value) { return `<div><span>${label}</span><strong>${value}</strong></div>`; }
  function option(value, label, selected) { return `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`; }
  function ticketCard(ticket) { return `<article class="ticket-card ${ticket.id === state.selectedId ? 'selected' : ''}"><div><strong>${ticket.folio}</strong><span>${ticket.category}</span><span>${ticket.location}</span><small>${ticket.date} · ${ticket.brigade}</small></div><div><b class="priority ${ticket.priority}">${PRIORITY_LABELS[ticket.priority]}</b><b class="${statusClass(ticket.status)}">${STATE_LABELS[ticket.status]}</b><button data-ticket="${ticket.id}">Ver detalle</button></div></article>`; }

  container.addEventListener('input', (event) => { const key = event.target?.dataset?.filter; if (key) { state[key] = event.target.value; render(); } if (event.target?.dataset?.action === 'comment') state.resolutionComment = event.target.value; });
  container.addEventListener('change', (event) => { if (event.target?.dataset?.action === 'evidence') { const file = event.target.files?.[0]; if (!file) return; state.evidenceName = file.name; state.evidencePreview = URL.createObjectURL(file); const ticket = selectedTicket(); ticket.evidence.push(`Evidencia enviada demo: ${file.name}`); state.pendingSync += state.online ? 0 : 1; state.notice = 'Evidencia simulada lista; no se subió a Storage.'; render(); } });
  container.addEventListener('click', (event) => { const action = event.target?.dataset?.action; const ticketId = event.target?.dataset?.ticket; if (ticketId) { state.selectedId = ticketId; state.notice = ''; render(); } if (action === 'toggle-online') { state.online = !state.online; render(); } if (action === 'sync') { state.pendingSync = state.online ? 0 : state.pendingSync; state.notice = state.online ? 'Cola demo sincronizada visualmente.' : 'Sigue offline; no se puede sincronizar todavía.'; render(); } if (action === 'start' || action === 'verify') setTicketStatus(action); if (action === 'arrival') { selectedTicket().timeline.push('Llegada marcada en campo (demo)'); state.notice = 'Llegada marcada visualmente.'; render(); } if (action === 'route') { state.notice = `Ruta demo preparada para ${selectedTicket().address}. Integración GPS/mapas pendiente sin API keys.`; render(); } });
  render();
}

const styles = `
  *{box-sizing:border-box}body{margin:0}.brigade-shell{min-height:100vh;padding:16px;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;background:linear-gradient(180deg,#e9f4ff,#f8fafc);color:#102033}.hero-card,.offline-card,.members-card,.detail,.ticket-list{background:#fff;border:1px solid #dbe7f3;border-radius:24px;box-shadow:0 18px 45px #16446b18}.hero-card{display:flex;gap:16px;justify-content:space-between;align-items:center;padding:22px}.hero-card h1{margin:4px 0;font-size:clamp(1.8rem,7vw,3.5rem)}.demo-pill{display:inline-flex;margin:0;padding:6px 10px;border-radius:999px;background:#fff4cc;color:#7a4b00;font-weight:800;font-size:.8rem}.connection,.offline-card button,.actions button,.map-card button,.ticket-card button{min-height:44px;border:0;border-radius:14px;padding:10px 14px;font-weight:800;cursor:pointer}.connection.online{background:#dff7e8;color:#087037}.connection.offline{background:#ffe2df;color:#9c1c12}.offline-card{display:flex;gap:10px;align-items:center;justify-content:space-between;margin:14px 0;padding:14px}.offline-card.is-offline{border-color:#ffb0a8;background:#fff7f6}.summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.metric{padding:16px;border-radius:20px;background:#12385b;color:#fff}.metric span,.detail-grid span,.ticket-card span,.ticket-card small{display:block;color:#6b7b8c}.metric span{color:#bcd6f0}.metric strong{font-size:1.4rem}.members-card{margin:14px 0;padding:16px}.members-card span{display:inline-flex;margin:6px 6px 0 0;padding:8px 10px;border-radius:999px;background:#edf5ff}.workbench{display:grid;grid-template-columns:1fr;gap:14px}.ticket-list,.detail{padding:16px}.filters{display:grid;gap:8px}.filters input,.filters select,textarea{width:100%;min-height:46px;border:1px solid #cbd8e5;border-radius:14px;padding:10px;font:inherit}.cards{display:grid;gap:10px;margin-top:12px}.ticket-card{display:grid;grid-template-columns:1fr;gap:10px;padding:14px;border:1px solid #dbe7f3;border-radius:18px;background:#fbfdff}.ticket-card.selected{outline:3px solid #72b8ff}.priority,.status-assigned,.status-in-progress,.status-pending-verification,.status-resolved{display:inline-block;margin:2px;padding:6px 8px;border-radius:999px;background:#eef2f7}.priority.critica,.priority.alta{background:#ffe2df;color:#9c1c12}.priority.media{background:#fff4cc;color:#7a4b00}.detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.detail-grid div,.map-card{padding:12px;border-radius:16px;background:#f4f8fc}.flow{display:flex;flex-wrap:wrap;gap:8px}.flow span{padding:10px;border-radius:999px;background:#e6edf5}.flow .done{background:#0d6efd;color:#fff}.actions{display:grid;grid-template-columns:1fr;gap:8px;margin:12px 0}.actions button,.map-card button,.ticket-card button,.offline-card button{background:#0d6efd;color:#fff}.upload{display:grid;place-items:center;min-height:48px;border-radius:14px;background:#102033;color:#fff;font-weight:800}.upload input{display:none}.preview{width:100%;max-height:260px;object-fit:cover;border-radius:18px;border:1px solid #cbd8e5}.notice{padding:10px;border-radius:14px;background:#ecfdf3;color:#087037;font-weight:700}footer{margin-top:16px;color:#5c6b7a;font-size:.9rem}@media (min-width:760px){.summary-grid{grid-template-columns:repeat(4,1fr)}.workbench{grid-template-columns:minmax(320px,.9fr) minmax(420px,1.1fr)}.ticket-card{grid-template-columns:1fr auto}.actions{grid-template-columns:repeat(4,1fr)}}`;
