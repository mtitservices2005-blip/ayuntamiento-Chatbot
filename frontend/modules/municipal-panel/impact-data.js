export const IMPACT_DEMO_NOTICE = 'Datos simulados para demostración · no representan resultados reales del ayuntamiento';
export const ECONOMIC_DEMO_NOTICE = 'Estimación demo · requiere datos reales del ayuntamiento para validación';
export const SCENARIO_DEMO_NOTICE = 'Escenario simulado para demostración';

export const impactFutureContract = {
  preparedForBackend: ['tickets agregados por período', 'categorías', 'sectores', 'estados', 'brigadas', 'timestamps de respuesta/asignación/resolución', 'banderas GPS/evidencia/descripción'],
  demoOnly: ['satisfacción ciudadana demo', 'duplicados detectados demo', 'interacciones automatizadas estimadas', 'ciudadanos recurrentes cuando el contrato futuro lo permita'],
  blocked: ['ciudadanos recurrentes reales: requiere identidad ciudadana o contrato analítico confirmado', 'satisfacción real: requiere encuesta/post-atención confirmada', 'ahorro real: requiere costos administrativos validados por el ayuntamiento'],
};

export const economicAssumptions = {
  averageCostPerCall: 38,
  administrativeMinutesPerCall: 7,
  administrativeHourlyCost: 325,
  automatedInteractions: 880,
};

const categories = ['Alumbrado público', 'Bacheo y vialidades', 'Recolección de residuos', 'Agua y drenaje', 'Parques y ornato'];
const sectors = ['Centro', 'Barrio Sur', 'Zona Norte', 'Las Flores', 'Mercado Municipal'];
const statuses = ['Resuelto', 'Pendiente', 'En proceso', 'Verificación'];
const brigades = ['Alumbrado Centro', 'Brigada Vial 02', 'Limpia Norte', 'Agua 01', 'Ornato 03'];

export const impactTickets = Array.from({ length: 120 }, (_, index) => {
  const ageDays = index % 92;
  const category = categories[index % categories.length];
  const sector = sectors[(index * 2) % sectors.length];
  const status = index % 10 < 6 ? statuses[0] : statuses[(index % 3) + 1];
  return {
    id: `IMPACT-DEMO-${String(index + 1).padStart(3, '0')}`,
    date: `2026-07-${String(15 - (ageDays % 15)).padStart(2, '0')}`,
    periodDay: ageDays,
    category,
    sector,
    status,
    brigade: brigades[index % brigades.length],
    hasGps: index % 5 !== 0,
    hasPhoto: index % 4 !== 0,
    completeDescription: index % 6 !== 0,
    duplicate: index % 29 === 0,
    needsMoreInfo: index % 11 === 0,
    firstResponseMinutes: 4 + (index % 9),
    assignmentMinutes: 18 + (index % 23),
    resolutionHours: status === 'Resuelto' ? 12 + (index % 36) : null,
    withinTarget: status === 'Resuelto' ? (12 + (index % 36)) <= 36 : false,
  };
});

export const beforeAfterMetrics = [
  { label: 'Tiempo promedio de primera respuesta', unit: 'min', before: 180, after: 8, direction: 'reduction' },
  { label: 'Tiempo promedio de resolución', unit: 'h', before: 72, after: 28, direction: 'reduction' },
  { label: 'Llamadas administrativas estimadas', unit: 'llamadas', before: 620, after: 210, direction: 'reduction' },
  { label: 'Reportes sin ubicación exacta', unit: 'reportes', before: 74, after: 24, direction: 'reduction' },
  { label: 'Reportes sin trazabilidad', unit: 'reportes', before: 96, after: 0, direction: 'reduction' },
  { label: 'Casos con seguimiento', unit: '%', before: 34, after: 94, direction: 'increase', percentagePoint: true },
];
