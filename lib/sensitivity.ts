import type { EntityRow } from "@/lib/entities";
import { buildScenario, type LabInputs } from "@/lib/lab";
import { draw, evaluate } from "@/lib/engine/simulate";
import type { Plan, Scenario } from "@/lib/engine/types";
import type { TwinState } from "@/lib/twin";

export type Bar = { label: string; low: number; high: number; lowNote: string; highNote: string };

/**
 * One-at-a-time sensitivity of expected cost for a FIXED plan (the optimised one), so the tornado answers
 * "which assumption moves my answer most?" without re-running the optimiser ten times.
 */
export function tornado(entity: EntityRow, inputs: LabInputs, twin: TwinState | undefined, plan: Plan): { base: number; bars: Bar[] } {
  const cost = (mod: (s: Scenario) => void, i: LabInputs = inputs) => {
    const s = buildScenario(entity, i, twin);
    mod(s);
    return evaluate(s, draw(s), plan).stats.mean;
  };
  const base = cost(() => {});
  const bars: Bar[] = [
    { label: "CCC price", low: cost(() => {}, { ...inputs, price: inputs.price * 0.75 }), high: cost(() => {}, { ...inputs, price: inputs.price * 1.25 }), lowNote: "−25%", highNote: "+25%" },
    { label: "Price volatility", low: cost(() => {}, { ...inputs, vol: inputs.vol * 0.75 }), high: cost(() => {}, { ...inputs, vol: Math.min(0.9, inputs.vol * 1.25) }), lowNote: "−25%", highNote: "+25%" },
    {
      label: "Lever costs",
      low: cost((s) => s.levers.forEach((l) => (l.costPerTonne *= 0.75))),
      high: cost((s) => s.levers.forEach((l) => (l.costPerTonne *= 1.25))),
      lowNote: "−25%", highNote: "+25%",
    },
    {
      label: "Lever delivery",
      low: cost((s) => s.levers.forEach((l) => (l.deliveryMean = Math.min(1.2, l.deliveryMean + 0.1)))),
      high: cost((s) => s.levers.forEach((l) => (l.deliveryMean = Math.max(0, l.deliveryMean - 0.1)))),
      lowNote: "+10 pts", highNote: "−10 pts",
    },
    {
      label: "Lever headroom",
      low: cost((s) => s.levers.forEach((l) => (l.potential *= 1.3))),
      high: cost((s) => s.levers.forEach((l) => (l.potential *= 0.7))),
      lowNote: "+30%", highNote: "−30%",
    },
    {
      label: "Production volume",
      low: cost((s) => (s.plant.output = [s.plant.output[0] * 0.9, s.plant.output[1] * 0.9])),
      high: cost((s) => (s.plant.output = [s.plant.output[0] * 1.1, s.plant.output[1] * 1.1])),
      lowNote: "−10%", highNote: "+10%",
    },
    {
      label: "Unabated intensity",
      low: cost((s) => (s.plant.unabatedIntensity = [s.plant.unabatedIntensity[0] * 0.99, s.plant.unabatedIntensity[1] * 0.99])),
      high: cost((s) => (s.plant.unabatedIntensity = [s.plant.unabatedIntensity[0] * 1.01, s.plant.unabatedIntensity[1] * 1.01])),
      lowNote: "−1%", highNote: "+1%",
    },
    {
      label: "Forward premium",
      low: cost((s) => (s.market = { ...s.market, forwardPremium: 0 })),
      high: cost((s) => (s.market = { ...s.market, forwardPremium: s.market.forwardPremium + 0.1 })),
      lowNote: "0%", highNote: "+10 pts",
    },
  ];
  bars.sort((a, b) => Math.abs(b.high - b.low) - Math.abs(a.high - a.low));
  return { base, bars };
}
