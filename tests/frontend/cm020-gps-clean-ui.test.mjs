import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const app = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/styles.css', import.meta.url), 'utf8');
const config = readFileSync(new URL('../../frontend/shared/municipal-config.js', import.meta.url), 'utf8');
const contracts = readFileSync(new URL('../../frontend/shared/contracts/channel-contracts.js', import.meta.url), 'utf8');

const mainMenuBlock = app.slice(app.indexOf('function defaultWelcome'), app.indexOf('function knowMunicipalityMenu'));
const mainMenuLabels = [...mainMenuBlock.matchAll(/\['([^']+)', conversationIntents\./g)].map((match) => match[1].replace(/^[^A-Za-zÁÉÍÓÚÑáéíóúñ]+\s*/, ''));
assert.deepEqual(mainMenuLabels, ['Reportar una incidencia', 'Solicitar un servicio municipal', 'Consultar mi reporte o solicitud', 'Conoce tu municipio', 'Contactos y horarios']);

const submenuBlock = app.slice(app.indexOf('function knowMunicipalityMenu'), app.indexOf('function bot'));
for (const label of ['Historia del municipio', 'Lugares emblemáticos', 'Conoce a tu alcalde', 'Conoce a tu vicealcaldesa', 'Concejo municipal', 'Volver al menú principal']) {
  assert.match(submenuBlock, new RegExp(label));
}

const flowOrder = [
  'function startReport',
  'function selectCategory',
  'function selectSector',
  'function requestCurrentLocation',
  'function askManualLocation',
  'function askDescription',
  'function askEvidence',
  'function showReportSummary',
  'function confirmReport',
  'function ticketActions',
];
let previousIndex = -1;
for (const marker of flowOrder) {
  const index = app.indexOf(marker);
  assert.ok(index > previousIndex, `${marker} debe conservar el orden aprobado`);
  previousIndex = index;
}

assert.match(app, /Usar mi ubicación actual/);
assert.doesNotMatch(app, /Compartir ubicación GPS demo/);
assert.match(app, /navigator\.geolocation\.getCurrentPosition/);
assert.match(app, /window\.isSecureContext === false/);
assert.match(app, /navigator\.geolocation/);
assert.match(app, /Solicitando permiso para acceder a tu ubicación/);
assert.match(app, /state\.report\.latitude = latitude/);
assert.match(app, /state\.report\.longitude = longitude/);
assert.match(app, /state\.report\.accuracy = accuracy/);
assert.match(app, /browser_geolocation/);
assert.match(app, /askDescription\(\)/);
assert.match(app, /PERMISSION_DENIED/);
assert.match(app, /POSITION_UNAVAILABLE/);
assert.match(app, /TIMEOUT/);
assert.match(app, /Este dispositivo o navegador no permite obtener la ubicación automáticamente/);
assert.match(app, /Intentar nuevamente/);
assert.match(app, /Escribir dirección o referencia/);

const appWithoutConfig = app;
assert.doesNotMatch(appWithoutConfig, /19\.6504/);
assert.doesNotMatch(appWithoutConfig, /-71\.0934/);
assert.doesNotMatch(appWithoutConfig, /GPS demo Laguna Salada/);
assert.match(config, /19\.6504/); // permitido solo como configuración municipal interna, no como fallback ciudadano.
assert.match(config, /-71\.0934/);

const citizenUiText = app.replace(/console\.warn\([^;]+;/g, '');
for (const forbidden of ['Contrato futuro', 'Contratos futuros', 'uploadPending', 'bucket ticket-evidence-v11', 'ruta <institution_id>', 'RPC v11_create_citizen_ticket', 'service_role']) {
  assert.doesNotMatch(citizenUiText, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.match(app, /REPORTE CREADO/);
assert.match(app, /REPORTE DEMO CREADO/);
assert.match(app, /Guarda tu folio para consultar el estado de tu reporte/);
assert.match(app, /La fotografía fue seleccionada, pero el envío de evidencia aún no está disponible en este entorno/);
assert.doesNotMatch(app, /Upload real bloqueado/);
assert.match(app, /startTicketLookup/);
assert.match(app, /showHistory/);
assert.match(app, /showContacts/);

const demoEntries = readdirSync(new URL('../../frontend', import.meta.url))
  .filter((name) => name.includes('chatbot-v1.1-demo') && statSync(join(new URL('../../frontend', import.meta.url).pathname, name)).isDirectory());
assert.deepEqual(demoEntries, ['chatbot-v1.1-demo']);
assert.match(html, /script type="module" src="app\.js"/);
assert.match(css, /\.quick-replies/);
assert.match(contracts, /ticketDraft/);
