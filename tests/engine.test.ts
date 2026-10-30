import { describe, expect, it } from "vitest";
import { simulate, draw, evaluate } from "@/lib/engine/simulate";
import { optimise, frontier } from "@/lib/engine/optimise";
import type { Lever, Scenario } from "@/lib/engine/types";

/**
 * Golden scenarios use zero volatility so every figure can be worked by hand.
 * Base: Q = 1,000,000 t both years; unabated 0.60; targets 0.58 / 0.56
 *   gross shortfall S = [1e6·0.02, 1e6·0.04] = [20,000 ; 40,000] t
 * Price ₹800 both years, no forward premium, penalty ×2, bank on, resale haircut 10%.
 */
const lever = (o: Partial<Lever> = {}): Lever => ({
  id: "L", name: "Lever", potential: 10_000, costPerTonne: 500, ramp: [0.5, 1], deliveryMean: 1, deliverySd: 0, source: "test", ...o,
});

const base = (o: Partial<Scenario> = {}): Scenario => ({
  plant: { name: "T", output: [1e6, 1e6], unabatedIntensity: [0.6, 0.6], target: [0.58, 0.56] },
  levers: [lever()],
  market: { meanPrice: [800, 800], sigma: [0, 0], rho: 0.8, forwardPremium: 0 },
  rules: { penaltyMultiple: 2, bankSurplusToNextYear: true, priceFloor: null, priceCeiling: null, sellHaircut: 0.1 },
  discountRate: 0,
  paths: 50,
  seed: 1,
  ...o,
});

const cost = (s: Scenario, plan: { levers: string[]; hedge: number }) => simulate(s, plan).stats.mean;

describe("golden scenarios (hand-worked, to the rupee)", () => {
  it("G1 spot only: 20,000×800 + 40,000×800 = ₹48,000,000", () => {
    expect(cost(base(), { levers: [], hedge: 0 })).toBeCloseTo(48_000_000, 0);
  });

  it("G2 one lever, full delivery: lever 5,000×500 + 10,000×500 = 7.5M; spot 15,000×800 + 30,000×800 = 36M; total 43.5M", () => {
    expect(cost(base(), { levers: ["L"], hedge: 0 })).toBeCloseTo(43_500_000, 0);
  });

  it("G3 80% delivery: lever cost still 7.5M (paid on planned); spot (16,000+32,000)×800 = 38.4M; total 45.9M", () => {
    const s = base({ levers: [lever({ deliveryMean: 0.8 })] });
    expect(cost(s, { levers: ["L"], hedge: 0 })).toBeCloseTo(45_900_000, 0);
  });

  it("G4 banking on: lever 30,000/yr @100 = 6M; FY26 surplus 10,000 banked against FY27 shortfall 10,000; total 6M", () => {
    const s = base({ levers: [lever({ potential: 30_000, costPerTonne: 100, ramp: [1, 1] })] });
    expect(cost(s, { levers: ["L"], hedge: 0 })).toBeCloseTo(6_000_000, 0);
  });

  it("G4b banking off: sell 10,000×800×0.9 = 7.2M; buy 10,000×800 = 8M; total 6M − 7.2M + 8M = 6.8M", () => {
    const s = base({
      levers: [lever({ potential: 30_000, costPerTonne: 100, ramp: [1, 1] })],
      rules: { penaltyMultiple: 2, bankSurplusToNextYear: false, priceFloor: null, priceCeiling: null, sellHaircut: 0.1 },
    });
    expect(cost(s, { levers: ["L"], hedge: 0 })).toBeCloseTo(6_800_000, 0);
  });

  it("G5 50% hedge, forward premium 10%: forward 880 × (10,000+20,000) = 26.4M; spot 800 × 30,000 = 24M; total 50.4M", () => {
    const s = base({ market: { meanPrice: [800, 800], sigma: [0, 0], rho: 0.8, forwardPremium: 0.1 } });
    expect(cost(s, { levers: [], hedge: 0.5 })).toBeCloseTo(50_400_000, 0);
  });

  it("G6 10% discount rate: 16M/1.1 + 32M/1.21 = ₹40,991,735.54", () => {
    expect(cost(base({ discountRate: 0.1 }), { levers: [], hedge: 0 })).toBeCloseTo(40_991_735.54, 1);
  });

  it("G7 price ceiling 700: 60,000 × 700 = ₹42,000,000", () => {
    const s = base();
    s.rules = { ...s.rules, priceCeiling: 700 };
    expect(cost(s, { levers: [], hedge: 0 })).toBeCloseTo(42_000_000, 0);
  });

  it("G8 over-hedged: 100% hedge on 20k/40k, but a lever removes 15,000/30,000 → hedge sized on net shortfall 5,000/10,000", () => {
    // levers cost 7.5M; planned shortfall [15,000; 30,000]·... lever potential 10,000 → net [15,000; 30,000]
    // hedge 100% of net: forward 800×45,000 = 36M; spot 0 → total 43.5M (same as G2 at zero premium)
    expect(cost(base(), { levers: ["L"], hedge: 1 })).toBeCloseTo(43_500_000, 0);
  });
});

describe("reproducibility and convergence", () => {
  const vol = base({ market: { meanPrice: [800, 900], sigma: [0.3, 0.4], rho: 0.8, forwardPremium: 0.05 }, paths: 10_000, seed: 42 });
  vol.rules = { ...vol.rules, penaltyMultiple: 1000 }; // disable the penalty cap so E[price] is exact

  it("same inputs and seed → identical result; different seed → different", () => {
    const a = simulate(vol, { levers: [], hedge: 0 }).stats.mean;
    const b = simulate(vol, { levers: [], hedge: 0 }).stats.mean;
    const c = simulate({ ...vol, seed: 43 }, { levers: [], hedge: 0 }).stats.mean;
    expect(a).toBe(b);
    expect(c).not.toBe(a);
  });

  it("standard error of the mean < 1% at 10,000 paths, and mean ≈ analytic E[cost]", () => {
    const e = simulate(vol, { levers: [], hedge: 0 });
    expect(e.stats.seRel).toBeLessThan(0.01);
    const analytic = 20_000 * 800 + 40_000 * 900; // E[P] = mean by construction
    expect(Math.abs(e.stats.mean - analytic) / analytic).toBeLessThan(0.02);
  });
});

describe("performance", () => {
  it("10,000 paths for one plan in under 1.5 s", () => {
    const s = base({ market: { meanPrice: [800, 900], sigma: [0.3, 0.4], rho: 0.8, forwardPremium: 0.05 }, paths: 10_000 });
    const t = performance.now();
    simulate(s, { levers: ["L"], hedge: 0.5 });
    expect(performance.now() - t).toBeLessThan(1500);
  });
});

describe("optimiser", () => {
  const s = base({
    levers: [
      lever({ id: "cheap", potential: 10_000, costPerTonne: 300, ramp: [1, 1] }),
      lever({ id: "dear", potential: 10_000, costPerTonne: 2_000, ramp: [1, 1] }),
    ],
    market: { meanPrice: [800, 800], sigma: [0.4, 0.4], rho: 0.8, forwardPremium: 0.02 },
    paths: 5_000, seed: 7,
  });

  it("switches on levers cheaper than the expected CCC price and leaves out dearer ones (risk-neutral)", () => {
    const { best } = optimise(s, 0);
    expect(best.plan.levers).toContain("cheap");
    expect(best.plan.levers).not.toContain("dear");
  });

  it("raising risk aversion never raises P95 cost", () => {
    const f = frontier(s, [0, 0.5, 1, 2]);
    for (let i = 1; i < f.length; i++) expect(f[i].p95).toBeLessThanOrEqual(f[i - 1].p95 + 1);
  });

  it("evaluating on shared draws equals simulating from scratch", () => {
    const d = draw(s);
    expect(evaluate(s, d, { levers: ["cheap"], hedge: 0.5 }).stats.mean).toBe(simulate(s, { levers: ["cheap"], hedge: 0.5 }).stats.mean);
  });
});
