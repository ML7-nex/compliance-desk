import type { EntityRow } from "@/lib/entities";
import type { Lever, Market, Rules, Scenario } from "./types";

export const DEFAULT_RULES: Rules = {
  penaltyMultiple: 2, // BEE procedure: environmental compensation = 2 × average CCC price traded in the compliance year
  // Banking is permitted under current regulations and borrowing from future years is not (secondary source:
  // Reclimatize, Apr 2026). Confirm against the CERC regulations and BEE detailed procedure.
  bankSurplusToNextYear: true,
  priceFloor: null,
  priceCeiling: null,
  sellHaircut: 0.1,
};

/**
 * Scenario price view. No CCC has traded and CERC has not set a floor or ceiling. Public analyst commentary
 * (unnamed analysts: IMPRI 28 Jul 2026, Reclimatize 7 Apr 2026) expects early prices of ₹600–1,200 per tonne.
 * Volatility and the FY27 uplift are our assumptions.
 */
export const DEFAULT_MARKET: Market = {
  meanPrice: [800, 900],
  sigma: [0.35, 0.45],
  rho: 0.8,
  forwardPremium: 0.03,
};

/** INR per USD used to convert dollar-denominated literature costs. Assumption; edit when you have a rate. */
export const FX_INR_PER_USD = 88;

const CEEW = "CEEW, Evaluating Net-zero for the Indian Cement Industry (Oct 2023)";
const POTENTIAL_NOTE = "Potential is illustrative: your plant's remaining headroom is unknown, so enter your own.";

/**
 * Cement lever templates. Costs come from the CEEW marginal abatement cost curve; potentials are placeholders
 * (share of the plant's FY27 gross shortfall each lever could remove at full ramp; they sum above 100% so the
 * optimiser must choose).
 */
const CEMENT_LEVERS: { id: string; name: string; potentialPct: number; costPerTonne: number; ramp: [number, number]; deliveryMean: number; deliverySd: number; source: string }[] = [
  {
    id: "clinker", name: "Clinker-factor reduction", potentialPct: 0.45, costPerTonne: 0, ramp: [0.5, 1], deliveryMean: 0.9, deliverySd: 0.15,
    source: `${CEEW}: three clinker-factor measures have negative cost (net saving); modelled at ₹0/t to be conservative. CEEW notes supply-chain limits on fly ash and slag, hence the delivery risk. ${POTENTIAL_NOTE}`,
  },
  {
    id: "efficiency", name: "Energy efficiency", potentialPct: 0.3, costPerTonne: 0, ramp: [0.5, 1], deliveryMean: 0.9, deliverySd: 0.1,
    source: `${CEEW}: nine energy-efficiency measures have negative cost (net saving); modelled at ₹0/t. ${POTENTIAL_NOTE}`,
  },
  {
    id: "whr", name: "Waste heat recovery", potentialPct: 0.15, costPerTonne: 0, ramp: [0, 0.7], deliveryMean: 0.85, deliverySd: 0.15,
    source: `${CEEW}: waste heat recovery sits in the negative-cost group; modelled at ₹0/t. ACEEE (2026) warns that better kiln efficiency reduces recoverable heat. ${POTENTIAL_NOTE}`,
  },
  {
    id: "re", name: "Renewable power (RTC)", potentialPct: 0.25, costPerTonne: Math.round(20 * FX_INR_PER_USD), ramp: [0.2, 0.8], deliveryMean: 0.8, deliverySd: 0.2,
    source: `${CEEW}: positive cost, about USD 20/tCO2 read off the cost-curve chart (approximate; text gives no exact figure), converted at ₹${FX_INR_PER_USD}/USD. ${POTENTIAL_NOTE}`,
  },
  {
    id: "afr", name: "Alternative fuels (TSR to 30%)", potentialPct: 0.4, costPerTonne: Math.round(42 * FX_INR_PER_USD), ramp: [0.3, 0.8], deliveryMean: 0.85, deliverySd: 0.2,
    source: `${CEEW}: about USD 42/tCO2 using municipal waste and biomass, converted at ₹${FX_INR_PER_USD}/USD. ${POTENTIAL_NOTE}`,
  },
];

/** Only cement has a default lever library so far; other sectors start with none and the user adds their own. */
export function levers(e: EntityRow): Lever[] {
  if (e.sector !== "Cement") return [];
  return CEMENT_LEVERS.map((t) => ({
    id: t.id, name: t.name, potential: t.potentialPct * Math.max((e.base - e.t27) * e.scale, 0.01 * e.baseEmissions), costPerTonne: t.costPerTonne,
    ramp: t.ramp, deliveryMean: t.deliveryMean, deliverySd: t.deliverySd, source: t.source,
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
