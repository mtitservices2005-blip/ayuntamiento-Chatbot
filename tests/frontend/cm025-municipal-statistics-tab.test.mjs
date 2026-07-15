import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { demoMunicipalConfig, municipalConfig } from '../../frontend/shared/municipal-config.js';

const app = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/styles.css', import.meta.url), 'utf8');

assert.doesNotMatch(html, /id="municipal-statistics"/);
assert.doesNotMatch(html, />Estadísticas<\/button>/);

assert.match(app, /function buildMunicipalStatistics\(profile = municipalConfig\)/);
assert.match(app, /buildWelcomeStatisticsText\(municipalConfig\)/);
assert.equal((app.match(/buildWelcomeStatisticsText\(municipalConfig\)/g) || []).length, 1);

const statisticsBuilder = app.slice(app.indexOf('export function buildMunicipalStatistics'), app.indexOf('function buildWelcomeStatisticsText'));
assert.match(statisticsBuilder, /label: 'Población'/);
assert.match(statisticsBuilder, /label: 'Área km²'/);
assert.match(statisticsBuilder, /label: 'Economía'/);
assert.doesNotMatch(statisticsBuilder, /source|year|meta|note|generalDescription|agriculture|commerce|officialFigures/);
assert.match(app, /const PENDING_VALIDATION = 'Pendiente'/);
assert.match(statisticsBuilder, /Agricultura · Comercio · Servicios/);

const handlePayloadBlock = app.slice(app.indexOf('function handlePayload'), app.indexOf('function showHistory'));
assert.match(handlePayloadBlock, /user\(label\);/);
for (const payload of [
  'REPORT_INCIDENT',
  'LOOKUP_TICKET',
  'KNOW_MUNICIPALITY',
  'CONTACTS_AND_HOURS',
  'MUNICIPAL_HISTORY',
  'LANDMARKS',
  'MAYOR_PROFILE',
  'DEPUTY_MAYOR_PROFILE',
  'MUNICIPAL_COUNCIL',
  'category:',
  'sector:',
  'location:gps',
  'location:manual',
  'evidence:add',
  'report:confirm',
  'MAIN_MENU',
]) {
  assert.match(handlePayloadBlock, new RegExp(payload.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

const handleTextBlock = app.slice(app.indexOf('function handleText'), app.indexOf('function handleEvidenceSelection'));
assert.match(handleTextBlock, /user\(text\);/);
assert.match(handleTextBlock, /report-manual-location/);
assert.match(handleTextBlock, /report-description/);
assert.match(handleTextBlock, /ticket-lookup/);


assert.equal(municipalConfig.institutionalContent.population.total, '10,627 habitantes');
assert.equal(municipalConfig.institutionalContent.territorialArea.valueKm2, '');
assert.deepEqual(municipalConfig.institutionalContent.economy.productiveActivities, ['Agricultura', 'Comercio local', 'Servicios municipales y comunitarios']);
const demoSerialized = JSON.stringify(demoMunicipalConfig.institutionalContent);
assert.doesNotMatch(demoSerialized, /Laguna Salada|10,627|Valverde|Máximo Gómez/);

for (const requiredFlow of ['function requestCurrentLocation', 'function askEvidence', 'function showReportSummary', 'function confirmReport', 'function startTicketLookup']) {
  assert.match(app, new RegExp(requiredFlow));
}
assert.match(app, /Guarda tu folio para consultar el estado de tu reporte/);
assert.match(app, /state\.report\.evidence/);
assert.match(app, /tracking/);
