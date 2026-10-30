import type { EntityRow } from "@/lib/entities";
import { scenarioFor } from "@/lib/engine/defaults";
import { draw, evaluate, grossShortfall } from "@/lib/engine/simulate";
import { optimise } from "@/lib/engine/optimise";
import type { Evaluation } from "@/lib/engine/types";

export type LabInputs = { price: number; vol: number; lambda: number };

/** One computation shared by the Lab screen and the AI brief, so the narrative always matches the numbers shown. */
export function computeLab(entity: EntityRow, { price, vol, lambda }: LabInputs) {
  const s = scenarioFor(entity);
  s.market = { ...s.market, meanPrice: [price, price * 1.125], sigma: [vol * 0.9, vol] };
  const d = draw(s);
  const cheap = s.levers.filter((l) => l.costPerTonne < price).map((l) => l.id);
  const { best } = optimise(s, lambda, undefined, d);
  const strategies: { name: string; e: Evaluation }[] = [
    { name: "Buy all on the market", e: evaluate(s, d, { levers: [], hedge: 0 }) },
    { name: "Abate cheap levers, buy the rest", e: evaluate(s, d, { levers: cheap, hedge: 0 }) },
    { name: "Abate cheap + hedge 50%", e: evaluate(s, d, { levers: cheap, hedge: 0.5 }) },
    { name: "Optimised for your risk setting", e: best },
  ];
  return { s, strategies, gross: grossShortfall(s) };
}
