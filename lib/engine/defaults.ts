import type { EntityRow } from "@/lib/entities";
import type { Lever, Market, Rules, Scenario } from "./types";

export const DEFAULT_RULES: Rules = {
  penaltyMultiple: 2,
  // OPEN QUESTION: confirm with the BEE detailed procedure how FY26 surplus carries into FY27.
  bankSurplusToNextYear: true,
  priceFloor: null,
  priceCeiling: null,
  sellHaircut: 0.1,
};

// PLACEHOLDER market view: no CCC has traded yet and CERC has not set a floor or ceiling.
export const DEFAULT_MARKET: Market = {
  meanPrice: [800, 900],
  sigma: [0.35, 0.45],
  rho: 0.8,
  forwardPremium: 0.03,
};

const ASSUMPTION = "Assumption (placeholder, uncited). Replace with a cited value before client use.";

/** Cement lever templates. potentialPct = share of the plant's FY27 gross shortfall each lever could remove at full ramp (placeholder; sums above 100% so the optimiser must choose). */
const CEMENT_LEVERS: { id: string; name: string; potentialPct: number; costPerTonne: number; ramp: [number, number]; deliveryMean: number; deliverySd: number }[] = [
  { id: "clinker", name: "Clinker substitution", potentialPct: 0.45, costPerTonne: 250, ramp: [0.5, 1], deliveryMean: 0.95, deliverySd: 0.1 },
  { id: "afr", name: "Alternative fuels", potentialPct: 0.4, costPerTonne: 500, ramp: [0.3, 0.8], deliveryMean: 0.85, deliverySd: 0.2 },
  { id: "efficiency", name: "Energy efficiency", potentialPct: 0.2, costPerTonne: 400, ramp: [0.5, 1], deliveryMean: 0.9, deliverySd: 0.1 },
  { id: "whr", name: "Waste heat recovery", potentialPct: 0.25, costPerTonne: 900, ramp: [0, 0.7], deliveryMean: 0.85, deliverySd: 0.15 },
  { id: "re", name: "Renewable power", potentialPct: 0.25, costPerTonne: 1100, ramp: [0.2, 0.8], deliveryMean: 0.8, deliverySd: 0.2 },
];

/** Only cement has a default lever library so far; other sectors start with none and the user adds their own. */
export function levers(e: EntityRow): Lever[] {
  if (e.sector !== "Cement") return [];
  return CEMENT_LEVERS.map((t) => ({
    id: t.id, name: t.name, potential: t.potentialPct * Math.max((e.base - e.t27) * e.scale, 0.01 * e.baseEmissions), costPerTonne: t.costPerTonne,
    ramp: t.ramp, deliveryMean: t.deliveryMean, deliverySd: t.deliverySd, source: ASSUMPTION,
  }));
}

/**
 * Atlas entity → scenario. Business-as-usual intensity = 2023-24 baseline (flat) until the Plant Twin
 * lets the user enter a production plan. A missing FY26 target is treated as no FY26 obligation.
 */
export function scenarioFor(e: EntityRow, paths = 10_000, seed = 2026): Scenario {
  return {
    plant: {
      name: e.name,
      output: [e.scale, e.scale] as [number, number],
      unabatedIntensity: [e.base, e.base],
      target: [e.t26 ?? e.base, e.t27],
    },
    levers: levers(e),
    market: DEFAULT_MARKET,
    rules: DEFAULT_RULES,
    discountRate: 0.1,
    paths,
    seed,
  };
}
