/** All money in ₹; all quantities in tCO2e unless stated. Year index 0 = FY2025-26, 1 = FY2026-27. */

export type Rules = {
  /** Penalty per uncovered tonne = multiple × average CCC price of that year. */
  penaltyMultiple: number;
  /** Surplus CCCs from FY26 may be used against the FY27 shortfall. OPEN QUESTION: confirm with BEE procedure. */
  bankSurplusToNextYear: boolean;
  /** Optional exchange floor/cap on CCC price (₹/t); null until CERC notifies. */
  priceFloor: number | null;
  priceCeiling: number | null;
  /** Fraction of spot value received when selling surplus credits (market depth haircut). */
  sellHaircut: number;
};

export type Plant = {
  name: string;
  /** Equivalent product output Q_y (tonnes), per year. */
  output: [number, number];
  /** Unabated (business-as-usual) GHG intensity, tCO2e/t, per year. */
  unabatedIntensity: [number, number];
  /** Notified targets, tCO2e/t, per year. */
  target: [number, number];
};

export type Lever = {
  id: string;
  name: string;
  /** Abatement potential at full ramp, tCO2e per year. */
  potential: number;
  /** ₹ per tCO2e of planned abatement (opex-equivalent, levelised). */
  costPerTonne: number;
  /** Share of potential live in each year (ramp-up curve). */
  ramp: [number, number];
  /** Delivered share of planned abatement: mean and sd (truncated to [0, 1.2]). */
  deliveryMean: number;
  deliverySd: number;
  source: string;
};

export type Market = {
  /** Mean CCC price (₹/t) by year. */
  meanPrice: [number, number];
  /** Lognormal log-volatility by year. */
  sigma: [number, number];
  /** Correlation between the two years' price shocks. */
  rho: number;
  /** Forward price = mean price × (1 + premium). */
  forwardPremium: number;
};

export type Scenario = {
  plant: Plant;
  levers: Lever[];
  market: Market;
  rules: Rules;
  /** Discount rate for NPV; 0 gives undiscounted cost. Cash flows at t=1 (FY26) and t=2 (FY27). */
  discountRate: number;
  paths: number;
  seed: number;
};

export type Plan = {
  /** Lever ids switched on. */
  levers: string[];
  /** Share of expected shortfall (net of planned abatement) bought forward, 0..1. */
  hedge: number;
};

export type Stats = {
  mean: number;
  sd: number;
  p5: number;
  p50: number;
  p95: number;
  cvar95: number;
  /** Standard error of the mean as a share of |mean|. */
  seRel: number;
};

export type Evaluation = {
  plan: Plan;
  stats: Stats;
  /** Per-path total cost (₹), kept for charts. */
  costs: Float64Array;
  expectedShortfall: [number, number];
};
