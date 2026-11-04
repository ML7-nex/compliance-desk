import { computeOptions, type OptionKey, type PlantInputs } from "@/lib/simple";

/**
 * "What if the price moves?" Try many credit prices around the one the user expects. A price can swing up or down,
 * never below zero, so each is the expected price times exp(volatility x a random normal draw), adjusted so the
 * average stays at the expected price. Then work out the three costs (lib/simple.ts) for every one.
 * Two assumptions, both the user's: the expected price and how much it can swing (volatility, one year).
 */

export const RUNS = 10_000;

export type Spread = { mean: number; good: number; bad: number };
export type Simulation = { runs: number; expected: number; volPct: number; priceGood: number; priceBad: number; gapT: number; buy: Spread; abate: Spread | null; mix: Spread };

/** Small seeded generator so the same inputs always give the same answer. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spread(xs: number[]): Spread {
  const s = [...xs].sort((a, b) => a - b);
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  return { mean: xs.reduce((t, x) => t + x, 0) / xs.length, good: at(0.05), bad: at(0.95) };
}

export function simulate(inputs: PlantInputs, target27: number, expected: number, volPct: number, runs = RUNS, seed = 20271): Simulation {
  const sigma = Math.max(0, volPct) / 100;
  const rnd = mulberry32(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  const buy: number[] = [], abate: number[] = [], mix: number[] = [], prices: number[] = [];
  let gapT = 0, abatePossible = true;
  for (let i = 0; i < runs; i++) {
    const price = expected * Math.exp(sigma * normal() - (sigma * sigma) / 2);
    prices.push(price);
    const r = computeOptions(inputs, target27, price);
    gapT = r.gapT;
    buy.push(r.options[0].total as number);
    mix.push(r.options[2].total as number);
    if (r.options[1].total == null) abatePossible = false; else abate.push(r.options[1].total);
  }
  const p = spread(prices);
  return { runs, expected, volPct, priceGood: p.good, priceBad: p.bad, gapT, buy: spread(buy), abate: abatePossible ? spread(abate) : null, mix: spread(mix) };
}

export const KEYS: OptionKey[] = ["buy", "abate", "mix"];
