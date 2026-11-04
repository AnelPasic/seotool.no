export const SCENARIO_MONTHS = 12;

export function createScenarioIllustration(current: number, monthlyScenarios: readonly number[], width: number, height = 128) {
  // Monthly outcomes under the selected growth assumption, not a forecast.
  const last = monthlyScenarios.length - 1;
  const scenario = monthlyScenarios[last];
  const baselineY = height - 40;
  const peak = Math.max(current, ...monthlyScenarios, 1);
  const points = (values: readonly number[]) => values.map((value, index) => {
    return { x: 12 + (width - 104) * index / last, y: baselineY - value / peak * (baselineY - 20), value };
  });
  const baseline = points(Array(monthlyScenarios.length).fill(current)), improved = points(monthlyScenarios);
  const path = (series: typeof baseline) => series.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  return {
    current: baseline, scenario: improved, currentPath: path(baseline), scenarioPath: path(improved),
    currentLabelY: baseline[last].y + (scenario > current ? 16 : -10),
    scenarioLabelY: improved[last].y + (scenario > current ? -10 : 16),
  };
}
