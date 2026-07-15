import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { municipalConfig } from '../../frontend/shared/municipal-config.js';

const app = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/index.html', import.meta.url), 'utf8');
const contracts = readFileSync(new URL('../../frontend/shared/contracts/channel-contracts.js', import.meta.url), 'utf8');

assert.deepEqual(municipalConfig.sectors, [
  'San Antonio',
  'Puerto Rico',
  'La Curva',
  'Pueblo Nuevo',
  'Las Flores',
  'Alto de La Hicotea',
]);
assert.equal(municipalConfig.reportPolicy.askMunicipality, false);
assert.equal(municipalConfig.reportPolicy.allowLocationOmission, false);
assert.ok(municipalConfig.reportCategories.some((category) => category.label === '🗑️ Basura acumulada' && category.requiresEvidence));

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
];
let previousIndex = -1;
for (const marker of flowOrder) {
  const index = app.indexOf(marker);
  assert.ok(index > previousIndex, `${marker} debe aparecer en orden de flujo`);
  previousIndex = index;
}

assert.match(app, /quickSectorOptions/);
assert.match(app, /Otro sector/);
assert.match(app, /state\.mode = 'report-sector'/);
assert.match(app, /state\.mode = 'report-other-sector'/);
assert.match(app, /Usar mi ubicación actual/);
assert.match(app, /navigator\.geolocation\.getCurrentPosition/);
assert.match(app, /Solicitando permiso para acceder a tu ubicación/);
assert.match(app, /Ubicación obtenida correctamente/);
assert.match(app, /browser_geolocation/);
assert.match(app, /state\.mode = 'report-manual-location'/);
assert.match(app, /manual-address/);
assert.match(app, /evidence-input/);
assert.match(html, /type="file"/);
assert.match(app, /fotografía fue seleccionada/);
assert.match(app, /Pendiente de envío/);
assert.doesNotMatch(app, /ticket-evidence-v11/);
assert.match(app, /Vista previa local/);
assert.match(app, /validateEvidenceFile/);
assert.match(app, /\*\*Categoría:\*\* \$\{state\.report\.category\}/);
assert.match(app, /\*\*Sector:\*\* \$\{state\.report\.sector\}/);
assert.match(app, /\*\*Ubicación:\*\* \${state\.report\.locationText}/);
assert.match(app, /\*\*Descripción:\*\* \$\{state\.report\.description\}/);
assert.match(app, /\*\*Evidencia:\*\* \${evidenceLabel}/);
assert.match(app, /report:confirm/);
assert.match(app, /report:correct/);
assert.match(app, /startReportCorrection/);
assert.match(app, /Folio demo: \$\{folio\}/);
assert.match(app, /LS-\$\{new Date\(\)\.toISOString/);

assert.match(contracts, /ticketDraft/);
assert.match(contracts, /latitude/);
assert.match(contracts, /evidence/);

const citizens = readFileSync(new URL('../../v1.1/js/citizen.js', import.meta.url), 'utf8');
const api = readFileSync(new URL('../../v1.1/js/api.js', import.meta.url), 'utf8');
assert.match(citizens, /requestCurrentLocation/);
assert.match(citizens, /validateCitizenEvidence/);
assert.match(api, /ticket-evidence-v11/);
assert.match(api, /v11_create_citizen_ticket/);
assert.doesNotMatch(app, /Crear reporte<\/h2>/);
