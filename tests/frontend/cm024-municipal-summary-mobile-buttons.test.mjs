import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { demoMunicipalConfig, municipalConfig } from '../../frontend/shared/municipal-config.js';

const app = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/styles.css', import.meta.url), 'utf8');

assert.doesNotMatch(html, /id="municipal-statistics"/);
assert.match(app, /function buildMunicipalStatistics\(profile = municipalConfig\)/);
assert.match(app, /buildWelcomeStatisticsText\(municipalConfig\)/);
assert.match(app, /profile\.institutionalContent/);
assert.doesNotMatch(app, /10,627 habitantes/);
assert.doesNotMatch(app, /valueKm2:\s*['"][0-9]/);
assert.match(app, /Agricultura · Comercio · Servicios/);

assert.equal(municipalConfig.institutionalContent.population.summaryValidated, true);
assert.equal(municipalConfig.institutionalContent.population.total, '10,627 habitantes');
assert.match(municipalConfig.institutionalContent.population.source, /ONE/);
assert.equal(municipalConfig.institutionalContent.territorialArea.summaryValidated, false);
assert.equal(municipalConfig.institutionalContent.territorialArea.valueKm2, '');
assert.deepEqual(municipalConfig.institutionalContent.economy.productiveActivities, ['Agricultura', 'Comercio local', 'Servicios municipales y comunitarios']);
assert.equal(municipalConfig.institutionalContent.economy.summaryValidated, true);

const demoSerialized = JSON.stringify(demoMunicipalConfig.institutionalContent);
assert.doesNotMatch(demoSerialized, /Laguna Salada|10,627|Valverde|Máximo Gómez/);
assert.equal(demoMunicipalConfig.institutionalContent.population.summaryValidated, false);
assert.equal(demoMunicipalConfig.institutionalContent.territorialArea.summaryValidated, false);
assert.equal(demoMunicipalConfig.institutionalContent.economy.summaryValidated, false);

const mobileBlock = css.slice(css.indexOf('@media (max-width: 640px)'), css.indexOf('@media (min-width: 641px)'));
assert.match(mobileBlock, /\.quick-replies\s*{[^}]*grid-template-columns:\s*1fr/s);
assert.match(mobileBlock, /\.quick-replies button\s*{[^}]*width:\s*100%/s);
assert.match(mobileBlock, /\.quick-replies button\s*{[^}]*min-height:\s*52px/s);
assert.match(mobileBlock, /gap:\s*10px/);
assert.match(css, /:focus-visible/);

for (const requiredFlow of ['function defaultWelcome', 'function knowMunicipalityMenu', 'function showPopulation', 'function showEconomy', 'function showLandmarkDetail', 'function startReport', 'function requestCurrentLocation', 'function askEvidence', 'function showReportSummary', 'function confirmReport', 'function startTicketLookup']) {
  assert.match(app, new RegExp(requiredFlow));
}
