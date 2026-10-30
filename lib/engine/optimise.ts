import { draw, evaluate, type Draws } from "./simulate";
import type { Evaluation, Plan, Scenario } from "./types";

export type Objective = (e: Evaluation) => number;

/** min E[C] + λ·CVaR95[C]. λ=0 is risk-neutral. */
export const riskObjective = (lambda: number): Objective => (e) => e.stats.mean + lambda * e.stats.cvar95;

export type Frontier = { plan: Plan; mean: number; p95: number; cvar95: number; score: number };

/**
 * Exhaustive search over lever subsets × hedge grid on common random numbers.
 * Exact for the discrete plan space (≤ 2^levers × grid points); fast for the 5–8 levers a cement plant has.
 * Planned replacement: HiGHS LP over the same paths for continuous lever sizing.
 */
export function optimise(s: Scenario, lambda: number, hedgeGrid = [0, 0.25, 0.5, 0.75, 1], draws?: Draws) {
  const d = draws ?? draw(s);
  const ids = s.levers.map((l) => l.id);
  const obj = riskObjective(lambda);
  let best: Evaluation | null = null;
  let bestScore = Infinity;
  const all: Frontier[] = [];
  for (let mask = 0; mask < 1 << ids.length; mask++) {
    const on = ids.filter((_, i) => mask & (1 << i));
    for (const h of hedgeGrid) {
      const e = evaluate(s, d, { levers: on, hedge: h });
      const score = obj(e);
      all.push({ plan: e.plan, mean: e.stats.mean, p95: e.stats.p95, cvar95: e.stats.cvar95, score });
      if (score < bestScore) { bestScore = score; best = e; }
    }
  }
  return { best: best!, all };
}

/** Risk–cost frontier: best plan at each λ. */
export function frontier(s: Scenario, lambdas: number[]) {
  const d = draw(s);
  return lambdas.map((lambda) => {
    const { best } = optimise(s, lambda, undefined, d);
    return { lambda, plan: best.plan, mean: best.stats.mean, p95: best.stats.p95, cvar95: best.stats.cvar95 };
  });
}
