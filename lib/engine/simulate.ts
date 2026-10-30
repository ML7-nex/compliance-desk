import { mulberry32, normalGen } from "./rng";
import type { Evaluation, Plan, Scenario, Stats } from "./types";

export type Draws = {
  n: number;
  /** CCC price by path and year (₹/t), after floor/ceiling. */
  price: [Float64Array, Float64Array];
  /** Delivery factor by lever index, then path. */
  delivery: Float64Array[];
};

/** Draw all random inputs once; every plan is then evaluated on the same paths (common random numbers). */
export function draw(s: Scenario): Draws {
  const { n, market, levers, rules } = { n: s.paths, ...s };
  const rand = mulberry32(s.seed);
  const z = normalGen(rand);
  const p0 = new Float64Array(n);
  const p1 = new Float64Array(n);
  const rho = market.rho;
  const k = Math.sqrt(1 - rho * rho);
  for (let i = 0; i < n; i++) {
    const z0 = z();
    const z1 = rho * z0 + k * z();
    // Lognormal with mean = meanPrice: P = m·exp(σz − σ²/2)
    let a = market.meanPrice[0] * Math.exp(market.sigma[0] * z0 - 0.5 * market.sigma[0] ** 2);
    let b = market.meanPrice[1] * Math.exp(market.sigma[1] * z1 - 0.5 * market.sigma[1] ** 2);
    if (rules.priceFloor != null) { a = Math.max(a, rules.priceFloor); b = Math.max(b, rules.priceFloor); }
    if (rules.priceCeiling != null) { a = Math.min(a, rules.priceCeiling); b = Math.min(b, rules.priceCeiling); }
    p0[i] = a;
    p1[i] = b;
  }
  const delivery = levers.map((l) => {
    const d = new Float64Array(n);
    for (let i = 0; i < n; i++) d[i] = l.deliverySd === 0 ? l.deliveryMean : Math.min(1.2, Math.max(0, l.deliveryMean + l.deliverySd * z()));
    return d;
  });
  return { n, price: [p0, p1], delivery };
}

/** Unabated shortfall before any lever: Q·(GEI_unabated − target), per year. */
export function grossShortfall(s: Scenario): [number, number] {
  const { plant: p } = s;
  return [0, 1].map((y) => p.output[y] * (p.unabatedIntensity[y] - p.target[y])) as [number, number];
}

export function summarise(costs: Float64Array): Stats {
  const n = costs.length;
  const sorted = Float64Array.from(costs).sort();
  let sum = 0;
  for (let i = 0; i < n; i++) sum += costs[i];
  const mean = sum / n;
  let ss = 0;
  for (let i = 0; i < n; i++) ss += (costs[i] - mean) ** 2;
  const sd = Math.sqrt(ss / Math.max(1, n - 1));
  const q = (p: number) => sorted[Math.min(n - 1, Math.floor(p * n))];
  const tailStart = Math.floor(0.95 * n);
  let tail = 0;
  for (let i = tailStart; i < n; i++) tail += sorted[i];
  const cvar95 = tail / Math.max(1, n - tailStart);
  return { mean, sd, p5: q(0.05), p50: q(0.5), p95: q(0.95), cvar95, seRel: mean === 0 ? 0 : sd / Math.sqrt(n) / Math.abs(mean) };
}

/**
 * Cost of one plan on every path.
 *
 * Per year y: abated_y = Σ_lever on  potential·ramp_y·delivery.  Shortfall S_y = Q·(GEI−target) − abated_y.
 * Lever cost is paid on planned (not delivered) tonnes.
 * Hedge: H_y = hedge × max(0, planned shortfall_y) bought at forward price F_y = mean price × (1+premium).
 * Settlement: net = S_y − H_y tonnes at spot. Positive → buy at min(P_y, penaltyMultiple × meanPrice_y).
 *   Negative → surplus credits: in FY26 banked to FY27 if allowed, else sold at P_y × (1 − haircut).
 */
export function evaluate(s: Scenario, d: Draws, plan: Plan): Evaluation {
  const n = d.n;
  const gross = grossShortfall(s);
  const on = s.levers.map((l, i) => ({ l, i })).filter(({ l }) => plan.levers.includes(l.id));
  const planned: [number, number] = [0, 0];
  const leverCost: [number, number] = [0, 0];
  for (const { l } of on) for (const y of [0, 1] as const) {
    planned[y] += l.potential * l.ramp[y];
    leverCost[y] += l.potential * l.ramp[y] * l.costPerTonne;
  }
  const expShort: [number, number] = [gross[0] - planned[0], gross[1] - planned[1]];
  const fwd = [0, 1].map((y) => s.market.meanPrice[y] * (1 + s.market.forwardPremium)) as [number, number];
  const hedged: [number, number] = [Math.max(0, expShort[0]) * plan.hedge, Math.max(0, expShort[1]) * plan.hedge];
  const df = [1 / (1 + s.discountRate), 1 / (1 + s.discountRate) ** 2];
  const cap = [s.rules.penaltyMultiple * s.market.meanPrice[0], s.rules.penaltyMultiple * s.market.meanPrice[1]];
  const sell = 1 - s.rules.sellHaircut;
  const costs = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const abated: [number, number] = [0, 0];
    for (const { l, i: li } of on) {
      const dl = d.delivery[li][i];
      abated[0] += l.potential * l.ramp[0] * dl;
      abated[1] += l.potential * l.ramp[1] * dl;
    }
    let total = 0;
    let bank = 0;
    for (const y of [0, 1] as const) {
      let net = gross[y] - abated[y] - hedged[y];
      const p = d.price[y][i];
      if (y === 1 && bank > 0) net -= bank; // banked FY26 surplus offsets FY27
      let spotCost: number;
      if (net >= 0) spotCost = net * Math.min(p, cap[y]);
      else if (y === 0 && s.rules.bankSurplusToNextYear) { bank = -net; spotCost = 0; }
      else spotCost = net * p * sell;
      total += (leverCost[y] + hedged[y] * fwd[y] + spotCost) * df[y];
    }
    costs[i] = total;
  }
  return { plan, stats: summarise(costs), costs, expectedShortfall: expShort };
}

export function simulate(s: Scenario, plan: Plan): Evaluation {
  return evaluate(s, draw(s), plan);
}
