import type { EntityRow } from "@/lib/entities";
import { scenarioFor } from "@/lib/engine/defaults";
import { draw, evaluate, grossShortfall } from "@/lib/engine/simulate";
import { optimise } from "@/lib/engine/optimise";
import type { Evaluation, Plan, Scenario } from "@/lib/engine/types";
import { applyTwin, type TwinState } from "@/lib/twin";

export type LabInputs = { price: number; vol: number; lambda: number };

export function buildScenario(entity: EntityRow, { price, vol }: LabInputs, twin?: TwinState): Scenario {
  let s = scenarioFor(entity);
  if (twin) s = applyTwin(s, twin);
  s.market = { ...s.market, meanPrice: [price, price * 1.125], sigma: [vol * 0.9, vol] };
  // Interactive speed: the exhaustive search doubles with each lever, so thin the paths for big lever sets.
  s.paths = s.levers.length > 5 ? 4_000 : 10_000;
  return s;
}

/** One computation shared by the Lab screen and the AI brief, so the narrative always matches the numbers shown. */
export function computeLab(entity: EntityRow, inputs: LabInputs, twin?: TwinState) {
  const s = buildScenario(entity, inputs, twin);
  const d = draw(s);
  const cheap = s.levers.filter((l) => l.costPerTonne < inputs.price).map((l) => l.id);
  const { best } = optimise(s, inputs.lambda, undefined, d);
  const run = (plan: Plan) => evaluate(s, d, plan);
  const strategies: { name: string; e: Evaluation }[] =
    s.levers.length > 0
      ? [
          { name: "Buy all on the market", e: run({ levers: [], hedge: 0 }) },
          { name: "Abate cheap levers, buy the rest", e: run({ levers: cheap, hedge: 0 }) },
          { name: "Abate cheap + hedge 50%", e: run({ levers: cheap, hedge: 0.5 }) },
          { name: "Optimised for your risk setting", e: best },
        ]
      : [
          { name: "Buy all on the market", e: run({ levers: [], hedge: 0 }) },
          { name: "Hedge 50% forward", e: run({ levers: [], hedge: 0.5 }) },
          { name: "Hedge 100% forward", e: run({ levers: [], hedge: 1 }) },
          { name: "Optimised for your risk setting", e: best },
        ];
  return { s, d, strategies, gross: grossShortfall(s), best };
}
