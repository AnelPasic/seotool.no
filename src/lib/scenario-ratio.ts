const multiplierFormat = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 });
const percentageFormat = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });

export function formatScenarioRatio(current: number, scenario: number) {
  const ratio = scenario / current;
  if (!Number.isFinite(current) || !Number.isFinite(scenario) || current <= 0 || scenario < 0 || !Number.isFinite(ratio) || !Number.isFinite(ratio * 100)) return null;
  return { multiplier: `${multiplierFormat.format(ratio)}X`, percentage: `(${percentageFormat.format(ratio * 100)}%)` };
}
