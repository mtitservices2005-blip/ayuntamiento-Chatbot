export const moduleId = 'storage';

const DEMO_LABEL = 'Datos demo · no producción';

const evidenceTypes = [
  'Foto inicial',
  'Foto de llegada',
  'Foto durante trabajo',
  'Foto de resolución',
  'Documento',
  'Otro adjunto',
];

const statuses = [
  'selected',
  'validating',
  'ready',
  'uploading',
  'uploaded',
  'pending_review',
  'approved',
  'rejected',
  'replacement_requested',
  'failed',
];

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const maxFileSize = 8 * 1024 * 1024;
const maxAttachmentsPerTicket = 6;

const demoTickets = [
  { id: 'TCK-1107', institution: 'Municipio Centro', category: 'Alumbrado público', stage: 'En trabajo' },
  { id: 'TCK-1108', institution: 'Municipio Norte', category: 'Bacheo', stage: 'Verificación' },
  { id: 'TCK-1109', institution: 'Municipio Centro', category: 'Recolección', stage: 'Resolución' },
  { id: 'TCK-1110', institution: 'Municipio Costa', category: 'Agua potable', stage: 'Diagnóstico' },
];

const demoEvidence = [
  {
    id: 'EVD-2026-001', fileName: 'luminaria-antes.jpg', ticket: 'TCK-1107', institution: 'Municipio Centro', institutionId: 'tenant-centro', brigade: 'Brigada Alfa', user: 'María López',
    type: 'Foto inicial', mime: 'image/jpeg', size: 2420000, date: '2026-07-15 08:24', status: 'approved', priority: 'Media', bucket: 'future-private-evidence',
    path: 'tenant-centro/TCK-1107/EVD-2026-001/luminaria-antes.jpg', correlation: 'corr-stg-8f31', checksum: 'sha256-demo-1b7a92', color: '#fed7aa', icon: '🌆', ticketStage: 'En trabajo', attachments: 3,
  },
  {
    id: 'EVD-2026-002', fileName: 'arribo-brigada.webp', ticket: 'TCK-1107', institution: 'Municipio Centro', institutionId: 'tenant-centro', brigade: 'Brigada Alfa', user: 'José Pérez',
    type: 'Foto de llegada', mime: 'image/webp', size: 1850000, date: '2026-07-15 09:10', status: 'pending_review', priority: 'Alta', bucket: 'future-private-evidence',
    path: 'tenant-centro/TCK-1107/EVD-2026-002/arribo-brigada.webp', correlation: 'corr-stg-2d90', checksum: 'sha256-demo-7ac0ef', color: '#bfdbfe', icon: '🚚', ticketStage: 'En trabajo', attachments: 3,
  },
  {
    id: 'EVD-2026-003', fileName: 'orden-materiales.pdf', ticket: 'TCK-1108', institution: 'Municipio Norte', institutionId: 'tenant-norte', brigade: 'Brigada Bacheo 2', user: 'Laura Méndez',
    type: 'Documento', mime: 'application/pdf', size: 620000, date: '2026-07-14 17:43', status: 'rejected', priority: 'Baja', bucket: 'future-private-evidence',
    path: 'tenant-norte/TCK-1108/EVD-2026-003/orden-materiales.pdf', correlation: 'corr-stg-55aa', checksum: 'sha256-demo-41cc09', color: '#fecaca', icon: '📄', ticketStage: 'Verificación', attachments: 2,
  },
  {
    id: 'EVD-2026-004', fileName: 'reparacion-final.png', ticket: 'TCK-1109', institution: 'Municipio Centro', institutionId: 'tenant-centro', brigade: 'Brigada Verde', user: 'Ana Ruiz',
    type: 'Foto de resolución', mime: 'image/png', size: 3940000, date: '2026-07-15 11:35', status: 'pending_review', priority: 'Crítica', bucket: 'future-private-evidence',
    path: 'tenant-centro/TCK-1109/EVD-2026-004/reparacion-final.png', correlation: 'corr-stg-91bc', checksum: 'sha256-demo-0de724', color: '#bbf7d0', icon: '✅', ticketStage: 'Resolución', attachments: 6,
  },
  {
    id: 'EVD-2026-005', fileName: 'archivo-vacio.jpg', ticket: 'TCK-1110', institution: 'Municipio Costa', institutionId: 'tenant-costa', brigade: 'Brigada Hidráulica', user: 'Pedro Salas',
    type: 'Otro adjunto', mime: 'image/jpeg', size: 0, date: '2026-07-13 15:12', status: 'failed', priority: 'Media', bucket: 'future-private-evidence',
    path: 'tenant-costa/TCK-1110/EVD-2026-005/archivo-vacio.jpg', correlation: 'corr-stg-019e', checksum: 'sha256-demo-failed', color: '#e5e7eb', icon: '⚠️', ticketStage: 'Diagnóstico', attachments: 1,
  },
  {
    id: 'EVD-2026-006', fileName: 'trabajo-en-progreso.jpg', ticket: 'TCK-1108', institution: 'Municipio Norte', institutionId: 'tenant-norte', brigade: 'Brigada Bacheo 2', user: 'Laura Méndez',
    type: 'Foto durante trabajo', mime: 'image/jpeg', size: 2760000, date: '2026-07-15 10:18', status: 'replacement_requested', priority: 'Alta', bucket: 'future-private-evidence',
    path: 'tenant-norte/TCK-1108/EVD-2026-006/trabajo-en-progreso.jpg', correlation: 'corr-stg-7781', checksum: 'sha256-demo-6bc52f', color: '#ddd6fe', icon: '🛠️', ticketStage: 'Verificación', attachments: 2,
  },
];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function previewMarkup(item) {
  return `<div class="storage-preview" style="--preview:${item.color}" aria-label="Preview demo ${item.fileName}"><span>${item.icon}</span></div>`;
}

function statusLabel(status) {
  return status.replaceAll('_', ' ');
}

function buildApp() {
  return `
    <section class="storage-shell" aria-label="Storage & Evidence V2">
      <header class="storage-hero">
        <div><p class="eyebrow">${DEMO_LABEL}</p><h1>Storage & Evidence V2</h1><p>Centro visual para evidencias de tickets: carga demo, revisión, políticas, trazabilidad y salud de Storage sin tocar servicios reales.</p></div>
        <div class="hero-card"><strong>Sin uploads reales</strong><span>Preparado para Supabase Storage + RLS + Audit V2</span></div>
      </header>
      <nav class="storage-tabs" aria-label="Secciones"><button data-tab="dashboard" class="active">Dashboard</button><button data-tab="library">Biblioteca</button><button data-tab="upload">Carga demo</button><button data-tab="review">Cola revisión</button><button data-tab="policies">Políticas</button><button data-tab="trace">Trazabilidad</button><button data-tab="health">Salud</button></nav>
      <main id="storage-view" tabindex="-1"></main>
    </section>`;
}

export function mount(container, context = {}) {
  if (!container) throw new Error('A mount container is required for storage.');
  const state = { tab: 'dashboard', evidence: [...demoEvidence], selectedId: demoEvidence[0].id, role: context.role || 'supervisor', filters: { q: '', institution: '', status: '', type: '', brigade: '', ticket: '', sort: 'date-desc' }, uploadStatus: 'selected', uploadFile: null };
  container.dataset.v2Module = moduleId;
  container.innerHTML = buildApp();
  const view = container.querySelector('#storage-view');

  const render = () => {
    container.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab));
    const renderers = { dashboard, library, upload, review, policies, trace, health };
    view.innerHTML = renderers[state.tab]();
    bindView();
  };

  const kpis = () => {
    const total = state.evidence.length;
    const today = state.evidence.filter((e) => e.date.startsWith('2026-07-15')).length;
    const pending = state.evidence.filter((e) => e.status === 'pending_review').length;
    const approved = state.evidence.filter((e) => e.status === 'approved').length;
    const rejected = state.evidence.filter((e) => e.status === 'rejected').length;
    const failed = state.evidence.filter((e) => e.status === 'failed').length;
    const used = state.evidence.reduce((a, e) => a + e.size, 0);
    const tickets = new Set(state.evidence.map((e) => e.ticket)).size;
    return { total, today, pending, approved, rejected, failed, used, average: used / total, tickets, coverage: '82%' };
  };

  const dashboard = () => {
    const data = kpis();
    const cards = [['Evidencias totales', data.total], ['Subidas hoy', data.today], ['Pendientes', data.pending], ['Aprobadas', data.approved], ['Rechazadas', data.rejected], ['Fallidas', data.failed], ['Espacio demo', formatBytes(data.used)], ['Tamaño promedio', formatBytes(data.average)], ['Tickets con evidencia', data.tickets], ['Cobertura', data.coverage]];
    return `<section class="grid kpi-grid">${cards.map(([label, value]) => `<article class="kpi"><span>${label}</span><strong>${value}</strong><small>${DEMO_LABEL}</small></article>`).join('')}</section><section class="panel"><h2>Ciclo de vida visual</h2><div class="state-flow">${statuses.map((s) => `<span>${statusLabel(s)}</span>`).join('')}</div></section><section class="grid two"><article class="panel"><h2>Uso y capacidad demo</h2><div class="meter"><i style="width:46%"></i></div><p>13.6 MB de 30 MB demo. No consulta ni factura Storage real.</p></article><article class="panel"><h2>Roles y visibilidad demo</h2><ul><li>brigade_member carga tickets asignados.</li><li>supervisor aprueba, rechaza o solicita reemplazo.</li><li>municipal_admin supervisa su institución.</li><li>mt_superadmin visualiza salud global.</li></ul><p class="warning">La seguridad real vive en backend, Auth, RLS y Storage policies.</p></article></section>`;
  };

  const filteredEvidence = () => state.evidence.filter((e) => (!state.filters.q || `${e.id} ${e.fileName} ${e.ticket}`.toLowerCase().includes(state.filters.q.toLowerCase())) && (!state.filters.institution || e.institution === state.filters.institution) && (!state.filters.status || e.status === state.filters.status) && (!state.filters.type || e.type === state.filters.type) && (!state.filters.brigade || e.brigade === state.filters.brigade) && (!state.filters.ticket || e.ticket === state.filters.ticket)).sort((a, b) => state.filters.sort === 'size-desc' ? b.size - a.size : b.date.localeCompare(a.date));
  const options = (values) => [...new Set(values)].map((v) => `<option>${v}</option>`).join('');
  const library = () => `<section class="panel"><h2>Biblioteca de evidencias</h2><div class="filters"><input data-filter="q" placeholder="Buscar evidence, archivo o ticket" value="${state.filters.q}"><select data-filter="institution"><option value="">Institución</option>${options(state.evidence.map((e) => e.institution))}</select><select data-filter="status"><option value="">Estado</option>${statuses.map((s) => `<option value="${s}">${statusLabel(s)}</option>`).join('')}</select><select data-filter="type"><option value="">Tipo</option>${evidenceTypes.map((t) => `<option>${t}</option>`).join('')}</select><select data-filter="brigade"><option value="">Brigada</option>${options(state.evidence.map((e) => e.brigade))}</select><select data-filter="ticket"><option value="">Ticket</option>${options(state.evidence.map((e) => e.ticket))}</select><select data-filter="sort"><option value="date-desc">Orden fecha</option><option value="size-desc">Orden tamaño</option></select></div><div class="evidence-list">${filteredEvidence().map(row).join('')}</div></section>${detail()}`;
  const row = (e) => `<article class="evidence-row"><button data-detail="${e.id}" class="row-main">${previewMarkup(e)}<span><strong>${e.id}</strong><small>${e.fileName}</small></span><span>${e.ticket}</span><span>${e.institution}</span><span>${e.brigade}</span><span>${e.user}</span><span>${e.type}</span><span>${formatBytes(e.size)}</span><span>${e.date}</span><span class="badge ${e.status}">${statusLabel(e.status)}</span></button></article>`;
  const detail = () => { const e = state.evidence.find((item) => item.id === state.selectedId) || state.evidence[0]; return `<section class="panel detail"><h2>Detalle de evidencia</h2><div class="detail-grid">${previewMarkup(e)}<dl><dt>Evidence ID</dt><dd>${e.id}</dd><dt>Archivo / MIME / tamaño</dt><dd>${e.fileName} · ${e.mime} · ${formatBytes(e.size)}</dd><dt>Ticket / institución / brigada / usuario</dt><dd>${e.ticket} · ${e.institution} · ${e.brigade} · ${e.user}</dd><dt>Fecha y estado</dt><dd>${e.date} · ${statusLabel(e.status)}</dd><dt>Bucket futuro</dt><dd>${e.bucket}</dd><dt>Object path futuro</dt><dd><code>${e.path}</code></dd><dt>Correlation ID / checksum</dt><dd>${e.correlation} · ${e.checksum}</dd><dt>Metadata segura</dt><dd>Sin tokens, contraseñas, service_role ni secretos.</dd></dl></div><div class="actions"><button data-action="approved">Aprobar</button><button data-action="rejected">Rechazar</button><button data-action="replacement_requested">Solicitar reemplazo</button><button>Ver ticket</button><button>Ver brigada</button><button>Ver auditoría relacionada</button><button data-copy="${e.id}">Copiar referencia demo</button></div>${timeline(e)}</section>`; };
  const timeline = (e) => `<ol class="timeline">${['Archivo seleccionado', 'Validación iniciada', 'Validación aprobada', 'Upload iniciado', 'Upload completado', 'Evidencia registrada', 'Revisión iniciada', statusLabel(e.status)].map((t) => `<li><strong>${t}</strong><span>${e.id} · ${e.ticket} · ${e.institutionId} · ${e.correlation}</span></li>`).join('')}</ol>`;

  const upload = () => `<section class="panel upload"><h2>Carga de evidencia demo</h2><p class="demo-pill">${DEMO_LABEL}</p><div class="drop-zone" id="drop-zone"><input id="storage-file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"><strong>Selecciona o arrastra una imagen/documento</strong><span>Vista previa local, sin upload real.</span></div><div id="file-preview" class="file-preview">Sin archivo seleccionado</div><label>Ticket demo<select id="ticket-select"><option value="">Selecciona ticket</option>${demoTickets.map((t) => `<option value="${t.id}">${t.id} · ${t.category}</option>`).join('')}</select></label><label>Tipo<select id="type-select">${evidenceTypes.map((t) => `<option>${t}</option>`).join('')}</select></label><label>Comentario<textarea id="comment" placeholder="Nota para supervisor"></textarea></label><p>Institución activa: <strong id="active-institution">Pendiente de ticket</strong></p><div id="validation-errors" role="alert"></div><button id="validate-upload" class="primary">Validar y simular flujo</button><div class="state-flow upload-flow">${['selected','validating','ready','uploading','uploaded','pending_review'].map((s) => `<span data-upload-state="${s}">${statusLabel(s)}</span>`).join('')}</div></section>`;
  const review = () => `<section class="panel"><h2>Cola de revisión para supervisores</h2><div class="review-grid">${state.evidence.filter((e) => e.status === 'pending_review').map((e) => `<article>${previewMarkup(e)}<h3>${e.id}</h3><p>${e.ticket} · ${e.brigade} · ${e.institution}</p><p>${e.type} · ${e.date} · Prioridad ${e.priority}</p><textarea placeholder="Añadir nota demo"></textarea><div class="actions"><button data-review="approved" data-id="${e.id}">Aprobar</button><button data-review="rejected" data-id="${e.id}">Rechazar con motivo</button><button data-review="replacement_requested" data-id="${e.id}">Solicitar reemplazo</button></div></article>`).join('')}</div></section>`;
  const policies = () => `<section class="grid two"><article class="panel"><h2>Políticas visuales demo</h2><ul><li>MIME permitidos: ${allowedMimeTypes.join(', ')}</li><li>Tamaño máximo: ${formatBytes(maxFileSize)}</li><li>Máximo por ticket: ${maxAttachmentsPerTicket}</li><li>Evidencia obligatoria por categoría y para resolución.</li><li>Retención, compresión, thumbnails y eliminación: futuras.</li></ul></article><article class="panel"><h2>Arquitectura multiinstitución</h2><pre>tenant_id/
  ticket_id/
    evidence_id/
      filename</pre><p>Ejemplo: tenant-centro/TCK-1107/EVD-2026-001/luminaria-antes.jpg</p><p class="warning">Nunca confiar solo en rutas frontend: aplicar Supabase Auth, memberships, tenant_id, RLS, Storage policies y funciones seguras.</p></article><article class="panel"><h2>Seguridad y privacidad</h2><ul><li>No exponer buckets privados públicamente.</li><li>No confiar en extensión; validar MIME, tamaño y nombres peligrosos.</li><li>No almacenar secretos, tokens, contraseñas ni service_role en frontend.</li><li>Aislamiento por institución y mínimo privilegio.</li></ul></article><article class="panel"><h2>Integración futura</h2><p>Supabase Auth, Storage, Tickets V1.1, Institutions, Memberships, RLS, Audit V2, Notifications V2, Brigade Portal V2, Municipal Panel V2, Realtime y Edge Functions seguras.</p></article></section>`;
  const trace = () => `<section class="panel"><h2>Trazabilidad demo e integraciones</h2>${timeline(state.evidence.find((e) => e.id === state.selectedId) || state.evidence[0])}<div class="grid two"><article><h3>Brigade Portal V2</h3><p>Brigada abre ticket → inicia trabajo → selecciona evidencia → añade comentario → valida → sube → envía a verificación.</p></article><article><h3>Municipal Panel V2</h3><p>Supervisor abre ticket → revisa evidencia → aprueba o rechaza → continúa flujo de verificación.</p></article></div></section>`;
  const health = () => `<section class="grid kpi-grid health">${[['Servicio','Operativo demo'],['Uploads','Simulados'],['Validaciones','Activas'],['Thumbnails futuros','Pendiente'],['Políticas','Visuales'],['RLS','Diseño futuro'],['Errores','1 fallido demo'],['Latencia','128 ms demo'],['Último upload','2026-07-15 11:35'],['Capacidad','46% demo']].map(([a,b]) => `<article class="kpi"><span>${a}</span><strong>${b}</strong><small>${DEMO_LABEL}</small></article>`).join('')}</section>`;

  const validateFile = (file, ticketId) => {
    const errors = [];
    if (!file) errors.push('Selecciona un archivo.');
    if (!ticketId) errors.push('El ticket es obligatorio.');
    const ticket = demoTickets.find((t) => t.id === ticketId);
    if (!ticket?.institution) errors.push('La institución es obligatoria.');
    if (file) {
      if (!allowedMimeTypes.includes(file.type)) errors.push('Tipo MIME no permitido.');
      if (file.size > maxFileSize) errors.push('El archivo supera el tamaño máximo demo.');
      if (file.size === 0) errors.push('El archivo está vacío.');
      if (/[\\/:*?"<>|]/.test(file.name)) errors.push('Nombre inválido o peligroso.');
      if (state.evidence.some((e) => e.fileName.toLowerCase() === file.name.toLowerCase())) errors.push('Duplicado demo detectado.');
      if (ticket && state.evidence.filter((e) => e.ticket === ticketId).length >= maxAttachmentsPerTicket) errors.push('Cantidad máxima de adjuntos alcanzada para este ticket demo.');
    }
    return errors;
  };

  const bindView = () => {
    view.querySelectorAll('[data-filter]').forEach((el) => { el.value = state.filters[el.dataset.filter] || ''; el.addEventListener('input', () => { state.filters[el.dataset.filter] = el.value; render(); }); });
    view.querySelectorAll('[data-detail]').forEach((el) => el.addEventListener('click', () => { state.selectedId = el.dataset.detail; render(); }));
    view.querySelectorAll('[data-action], [data-review]').forEach((el) => el.addEventListener('click', () => { const id = el.dataset.id || state.selectedId; const item = state.evidence.find((e) => e.id === id); if (item) item.status = el.dataset.action || el.dataset.review; render(); }));
    const ticketSelect = view.querySelector('#ticket-select');
    if (ticketSelect) ticketSelect.addEventListener('change', () => { const ticket = demoTickets.find((t) => t.id === ticketSelect.value); view.querySelector('#active-institution').textContent = ticket?.institution || 'Pendiente de ticket'; });
    const fileInput = view.querySelector('#storage-file');
    if (fileInput) fileInput.addEventListener('change', () => { state.uploadFile = fileInput.files[0]; const preview = view.querySelector('#file-preview'); if (state.uploadFile) preview.textContent = `${state.uploadFile.name} · ${formatBytes(state.uploadFile.size)} · ${state.uploadFile.type || 'tipo desconocido'}`; });
    const dropZone = view.querySelector('#drop-zone');
    if (dropZone) {
      ['dragenter', 'dragover'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add('is-dragging'); }));
      ['dragleave', 'drop'].forEach((eventName) => dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.remove('is-dragging'); }));
      dropZone.addEventListener('drop', (event) => {
        state.uploadFile = event.dataTransfer.files[0];
        const preview = view.querySelector('#file-preview');
        if (state.uploadFile) preview.textContent = `${state.uploadFile.name} · ${formatBytes(state.uploadFile.size)} · ${state.uploadFile.type || 'tipo desconocido'}`;
      });
    }
    const validate = view.querySelector('#validate-upload');
    if (validate) validate.addEventListener('click', () => { const errors = validateFile(state.uploadFile, ticketSelect.value); view.querySelector('#validation-errors').innerHTML = errors.map((e) => `<p>${e}</p>`).join(''); if (errors.length) return; ['selected','validating','ready','uploading','uploaded','pending_review'].forEach((s, i) => setTimeout(() => { view.querySelectorAll('[data-upload-state]').forEach((el) => el.classList.toggle('active', el.dataset.uploadState === s)); }, i * 180)); });
  };

  container.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { state.tab = button.dataset.tab; render(); view.focus(); }));
  render();
}

export const __storageDemo = { demoEvidence, demoTickets, allowedMimeTypes, maxFileSize, maxAttachmentsPerTicket, evidenceTypes, statuses };
