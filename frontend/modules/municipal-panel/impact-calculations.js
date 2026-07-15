export function percentage(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

export function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  return valid.length ? Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length) : 0;
}

export function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] ?? 'Sin dato';
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function compareValues(before, after, { percentagePoint = false } = {}) {
  const difference = after - before;
  const absoluteDifference = Math.abs(difference);
  if (percentagePoint) return { difference, absoluteDifference, label: `${difference > 0 ? '+' : ''}${difference} puntos porcentuales` };
  const change = before ? Math.round((absoluteDifference / before) * 100) : 0;
  return { difference, absoluteDifference, change, label: `${difference < 0 ? 'reducción' : 'mejora'} ${change}%` };
}

export function applyImpactFilters(tickets, filters = {}) {
  const periodLimits = { today: 0, '7d': 6, '30d': 29, quarter: 91, year: 364, custom: 29 };
  const maxAge = periodLimits[filters.period || '30d'] ?? 29;
  return tickets.filter((ticket) => ticket.periodDay <= maxAge)
    .filter((ticket) => !filters.category || filters.category === 'all' || ticket.category === filters.category)
    .filter((ticket) => !filters.sector || filters.sector === 'all' || ticket.sector === filters.sector)
    .filter((ticket) => !filters.status || filters.status === 'all' || ticket.status === filters.status)
    .filter((ticket) => !filters.brigade || filters.brigade === 'all' || ticket.brigade === filters.brigade);
}

export function calculateEconomicImpact(assumptions) {
  const hoursFreed = Math.round((assumptions.automatedInteractions * assumptions.administrativeMinutesPerCall) / 60);
  const avoidedByCalls = assumptions.automatedInteractions * assumptions.averageCostPerCall;
  const avoidedByHours = hoursFreed * assumptions.administrativeHourlyCost;
  const monthlyAvoidedCost = avoidedByCalls + avoidedByHours;
  return { hoursFreed, monthlyAvoidedCost, annualProjection: monthlyAvoidedCost * 12, automatedInteractions: assumptions.automatedInteractions };
}

export function buildImpactSummary(tickets, assumptions) {
  const total = tickets.length;
  const resolved = tickets.filter((ticket) => ticket.status === 'Resuelto').length;
  const pending = tickets.filter((ticket) => ticket.status !== 'Resuelto').length;
  const economic = calculateEconomicImpact(assumptions);
  return {
    total,
    resolved,
    pending,
    conversations: Math.round(total * 1.85),
    automatedCitizens: Math.round(total * 1.42),
    satisfaction: 92,
    recurrentCitizens: 'DEMO_ONLY',
    resolutionRate: percentage(resolved, total),
    firstResponseAverage: average(tickets.map((ticket) => ticket.firstResponseMinutes)),
    assignmentAverage: average(tickets.map((ticket) => ticket.assignmentMinutes)),
    resolutionAverage: average(tickets.map((ticket) => ticket.resolutionHours)),
    withinTargetRate: percentage(tickets.filter((ticket) => ticket.withinTarget).length, resolved),
    gpsRate: percentage(tickets.filter((ticket) => ticket.hasGps).length, total),
    photoRate: percentage(tickets.filter((ticket) => ticket.hasPhoto).length, total),
    completeDescriptionRate: percentage(tickets.filter((ticket) => ticket.completeDescription).length, total),
    duplicates: tickets.filter((ticket) => ticket.duplicate).length,
    needsMoreInfo: tickets.filter((ticket) => ticket.needsMoreInfo).length,
    byCategory: countBy(tickets, 'category'),
    bySector: countBy(tickets, 'sector'),
    byStatus: countBy(tickets, 'status'),
    byBrigade: countBy(tickets, 'brigade'),
    economic,
  };
}
