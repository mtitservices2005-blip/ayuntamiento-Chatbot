import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contentStatuses, demoMunicipalConfig, municipalConfig } from '../../frontend/shared/municipal-config.js';

const app = readFileSync(new URL('../../frontend/chatbot-v1.1-demo/app.js', import.meta.url), 'utf8');

const mainMenuBlock = app.slice(app.indexOf('function defaultWelcome'), app.indexOf('function knowMunicipalityMenu'));
const mainMenuLabels = [...mainMenuBlock.matchAll(/\['([^']+)', conversationIntents\./g)].map((match) => match[1].replace(/^[^A-Za-zÁÉÍÓÚÑáéíóúñ]+\s*/, ''));
assert.deepEqual(mainMenuLabels, ['Reportar una incidencia', 'Solicitar un servicio municipal', 'Consultar mi reporte o solicitud', 'Conoce tu municipio', 'Contactos y horarios']);

const submenuBlock = app.slice(app.indexOf('function knowMunicipalityMenu'), app.indexOf('function bot'));
for (const label of ['Historia del municipio', 'Población', 'Economía', 'Lugares emblemáticos', 'Conoce a tu alcalde', 'Conoce a tu vicealcaldesa', 'Concejo municipal']) {
  assert.match(submenuBlock, new RegExp(label));
}

assert.equal(municipalConfig.institutionalContent.population.status, contentStatuses.PUBLISHED);
assert.equal(municipalConfig.institutionalContent.population.total, '10,627 habitantes');
assert.match(municipalConfig.institutionalContent.population.source, /ONE/);
assert.equal(municipalConfig.institutionalContent.economy.status, contentStatuses.PUBLISHED);
assert.match(municipalConfig.institutionalContent.economy.agriculture, /agrícola|agricultura/i);
assert.match(municipalConfig.institutionalContent.economy.commerce, /comercio/i);

const publishedLandmarks = municipalConfig.institutionalContent.landmarks.filter((place) => place.status === contentStatuses.PUBLISHED);
assert.ok(publishedLandmarks.some((place) => place.name === 'Parque Municipal Mirador del Valle “Máximo Gómez”'));
assert.ok(publishedLandmarks.some((place) => place.name === 'Palacio Municipal de Laguna Salada'));
assert.ok(publishedLandmarks.some((place) => place.name === 'Parroquia San Antonio de Padua'));
assert.ok(publishedLandmarks.some((place) => place.name === 'Cementerio Municipal de Laguna Salada'));
assert.ok(publishedLandmarks.every((place) => place.description && place.importance && place.location && place.photoUrl));

const landmarksListBlock = app.slice(app.indexOf('function showLandmarks'), app.indexOf('function showLandmarkDetail'));
assert.match(landmarksListBlock, /quickReplies\(publishedPlaces\.map/);
assert.doesNotMatch(landmarksListBlock, /forEach\(\(place\) => card/);

const landmarkDetailBlock = app.slice(app.indexOf('function showLandmarkDetail'), app.indexOf('function showContacts'));
assert.match(landmarkDetailBlock, /content\.landmarks\.find/);
assert.match(landmarkDetailBlock, /item\.id === placeId/);
assert.match(landmarkDetailBlock, /Volver al listado de lugares/);
assert.match(landmarkDetailBlock, /Importancia histórica\/cultural/);
assert.match(landmarkDetailBlock, /Ubicación o referencia/);

assert.match(app, /function showHistory/);
assert.match(app, /function showAuthority/);
assert.match(app, /function showCouncil/);
assert.match(app, /startReport/);
assert.match(app, /requestCurrentLocation/);
assert.match(app, /validateEvidenceFile/);
assert.match(app, /startTicketLookup/);

const demoSerialized = JSON.stringify(demoMunicipalConfig.institutionalContent);
assert.doesNotMatch(demoSerialized, /Laguna Salada|10,627|Valverde|Máximo Gómez/);
const lagunaSerialized = JSON.stringify(municipalConfig.institutionalContent);
assert.match(lagunaSerialized, /Laguna Salada/);
assert.match(lagunaSerialized, /10,627 habitantes/);
