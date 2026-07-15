import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { demoMunicipalConfig } from '../../frontend/shared/municipal-config.js';

const app = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/index.html', import.meta.url), 'utf8');
const panel = readFileSync(new URL('../../frontend/modules/municipal-panel/index.js', import.meta.url), 'utf8');

assert.doesNotMatch(html, />Estadísticas<\/button>/);
assert.doesNotMatch(html, /municipal-statistics/);
assert.match(app, /buildWelcomeStatisticsText\(municipalConfig\)/);
assert.match(app, /label: 'Población'/);
assert.match(app, /label: 'Área km²'/);
assert.match(app, /label: 'Economía'/);
assert.match(app, /Agricultura · Comercio · Servicios/);
assert.equal((app.match(/buildWelcomeStatisticsText\(municipalConfig\)/g) || []).length, 1);
assert.doesNotMatch(JSON.stringify(demoMunicipalConfig.institutionalContent), /Laguna Salada|10,627|Valverde|Máximo Gómez/);

for (const field of ['Tipo', 'Categoría', 'Subtipo', 'Sector', 'Ubicación', 'Descripción', 'Evidencia', 'Fecha', 'Hora', 'Contacto', 'Departamento']) {
  assert.match(app, new RegExp(`\\*\\*${field}:\\*\\*`));
}
assert.match(html, /type="date"/);
assert.match(html, /type="time"/);
assert.match(app, /dateInput\.showPicker/);
assert.match(app, /timeInput\.showPicker/);
assert.match(app, /dateInput\.min = todayIsoDate\(\)/);
assert.match(app, /isPastDate/);
assert.match(app, /formatDateForSummary/);
assert.match(app, /formatTimeForSummary/);

assert.match(panel, /Solicitudes de Servicios/);
assert.match(panel, /data-service-command-center/);
for (const kpi of ['solicitudes recibidas', 'asignadas', 'en proceso', 'en revisión', 'resueltas', 'cerradas', 'rechazadas', 'canceladas', 'vencidas o fuera de plazo demo']) {
  assert.match(panel, new RegExp(kpi));
}
for (const filter of ['estado', 'servicio', 'subtipo', 'departamento', 'responsable', 'sector', 'período', 'prioridad']) {
  assert.match(panel, new RegExp(filter));
}
for (const status of ['Recibida', 'Asignada', 'En proceso', 'En revisión', 'Resuelta', 'Cerrada', 'Rechazada', 'Cancelada', 'Vencida']) {
  assert.match(panel, new RegExp(status));
}
assert.match(panel, /Incidencias/);
assert.match(panel, /Solicitudes de servicios/);
assert.match(panel, /Todos los casos/);
assert.match(panel, /SLA visual demo/);
assert.match(panel, /Prioridad/);
assert.match(panel, /Próxima acción/);
assert.match(panel, /Asignar brigada o departamento|asignar/);
assert.match(panel, /Certificaciones no dependen de brigada/);
for (const action of ['marcar en proceso', 'enviar a revisión', 'resolver', 'cerrar', 'rechazar', 'cancelar', 'solicitar información adicional', 'devolver a revisión', 'reabrir controladamente']) {
  assert.match(panel, new RegExp(action));
}
for (const notification of ['solicitud recibida', 'asignada', 'en proceso', 'en revisión', 'resuelta', 'documento listo para retiro', 'cerrada', 'rechazada', 'información adicional requerida']) {
  assert.match(panel, new RegExp(notification));
}

for (const regression of ['Reportar una incidencia', 'Solicitar un servicio municipal', 'Consultar mi reporte o solicitud', 'Población', 'Economía', 'Lugares', 'alcalde', 'vicealcaldesa', 'Concejo', 'Brigadas', 'Centro de Impacto Municipal', 'SOL-', 'REP|LS-']) {
  assert.match(app + panel, new RegExp(regression, 'i'));
}
