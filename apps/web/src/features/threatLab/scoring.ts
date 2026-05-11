import type { SimulationResult, ThreatScenario } from "./types";

export function evaluateScenario(scenario: ThreatScenario, flaggedIds: string[]): SimulationResult {
  const flagged = new Set(flaggedIds);
  const suspiciousTargets = scenario.targets.filter((target) => target.suspicious);
  const benignTargets = scenario.targets.filter((target) => !target.suspicious);

  const foundIndicators = suspiciousTargets.filter((target) => flagged.has(target.id));
  const missedIndicators = suspiciousTargets.filter((target) => !flagged.has(target.id));
  const falsePositives = benignTargets.filter((target) => flagged.has(target.id));

  const positivePoints = foundIndicators.reduce((total, target) => total + target.points, 0);
  const penaltyPoints = falsePositives.reduce((total, target) => total + Math.max(6, target.points / 2), 0);
  const totalAvailable = suspiciousTargets.reduce((total, target) => total + target.points, 0) || 1;

  const rawAccuracy = positivePoints / totalAvailable;
  const awarenessScore = Math.max(
    5,
    Math.min(100, Math.round(rawAccuracy * 100 - penaltyPoints + (missedIndicators.length === 0 ? 8 : 0)))
  );

  return {
    awarenessScore,
    accuracy: Math.max(0, Math.min(100, Math.round(rawAccuracy * 100))),
    foundIndicators,
    missedIndicators,
    falsePositives,
  };
}
