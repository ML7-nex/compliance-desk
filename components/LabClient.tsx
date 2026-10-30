"use client";
import { useMemo, useState } from "react";
import type { EntityRow } from "@/lib/entities";
import { scenarioFor } from "@/lib/engine/defaults";
import { draw, evaluate, grossShortfall } from "@/lib/engine/simulate";
import { optimise } from "@/lib/engine/optimise";
import type { Evaluation } from "@/lib/engine/types";

const cr = (x: number) => `₹${(x / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 1 })} cr`;
// One colour per strategy, colour-blind safe (Okabe–Ito), used everywhere.
const COLORS = ["#6b7280", "#0072B2", "#E69F00", "#009E73"];

export default function LabClient({ entity }: { entity: EntityRow }) {
  const [price, setPrice] = useState(800);
  const [vol, setVol] = useState(0.4);
  const [lambda, setLambda] = useState(0.5);

  const result = useMemo(() => {
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
  }, [entity, price, vol, lambda]);

  const all = result.strategies.flatMap((x) => Array.from(x.e.costs));
  const lo = Math.min(...all), hi = Math.max(...all);
  const bins = 40;
  const hist = result.strategies.map(({ e }) => {
    const h = new Array(bins).fill(0);
    for (const c of e.costs) h[Math.min(bins - 1, Math.floor(((c - lo) / (hi - lo || 1)) * bins))]++;
    return h;
  });
  const hmax = Math.max(...hist.flat());
  const w = 640, ht = 200;
  const [spot, , , opt] = result.strategies;
  const saving = spot.e.stats.p95 - opt.e.stats.p95;

  return (
    <div className="mt-6">
      <p className="rounded bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        Illustrative. Business-as-usual intensity equals the 2023-24 baseline, lever costs and potentials are uncited placeholders, and no CCC price exists yet. Not advice.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="text-sm">Expected CCC price FY26: ₹{price}/t
          <input type="range" min={200} max={2500} step={50} value={price} onChange={(e) => setPrice(+e.target.value)} className="w-full" />
        </label>
        <label className="text-sm">Price volatility: {(vol * 100).toFixed(0)}%
          <input type="range" min={0.1} max={0.9} step={0.05} value={vol} onChange={(e) => setVol(+e.target.value)} className="w-full" />
        </label>
        <label className="text-sm">Risk aversion λ: {lambda.toFixed(1)}
          <input type="range" min={0} max={3} step={0.1} value={lambda} onChange={(e) => setLambda(+e.target.value)} className="w-full" />
        </label>
      </div>
      <p className="mt-4 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
        Gross shortfall before action: FY26 {(result.gross[0] / 1000).toFixed(0)} kt, FY27 {(result.gross[1] / 1000).toFixed(0)} kt. {result.s.paths.toLocaleString("en-IN")} simulated paths, seed {result.s.seed}.
      </p>
      <p className="mt-2 font-medium">
        The optimised plan cuts the bad-year (P95) cost by {cr(saving)} versus buying everything on the market, for an expected cost of {cr(opt.e.stats.mean)} against {cr(spot.e.stats.mean)}.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Cost distribution by strategy (NPV, ₹ crore)</h2>
      <svg role="img" aria-label="Histogram of simulated total cost per strategy" viewBox={`0 0 ${w} ${ht + 30}`} className="mt-2 w-full">
        {hist.map((h, si) => (
          <polyline key={si} fill="none" stroke={COLORS[si]} strokeWidth="2"
            points={h.map((v, i) => `${(i / (bins - 1)) * w},${ht - (v / hmax) * (ht - 10)}`).join(" ")} />
        ))}
        <text x="0" y={ht + 20} fontSize="11" fill="currentColor">{cr(lo)}</text>
        <text x={w} y={ht + 20} fontSize="11" textAnchor="end" fill="currentColor">{cr(hi)}</text>
      </svg>

      <table className="mt-4 w-full text-sm tabular-nums">
        <caption className="sr-only">Cost summary by strategy</caption>
        <thead><tr className="text-left"><th className="py-1">Strategy</th><th className="text-right">Expected cost</th><th className="text-right">P5</th><th className="text-right">P95</th><th className="text-right">Levers on</th><th className="text-right">Hedge</th></tr></thead>
        <tbody>
          {result.strategies.map(({ name, e }, i) => (
            <tr key={name} className="border-t border-zinc-200 dark:border-zinc-800">
              <th scope="row" className="py-1 text-left font-normal"><span aria-hidden className="mr-2 inline-block h-2 w-4 align-middle" style={{ background: COLORS[i] }} />{name}</th>
              <td className="text-right">{cr(e.stats.mean)}</td><td className="text-right">{cr(e.stats.p5)}</td><td className="text-right">{cr(e.stats.p95)}</td>
              <td className="text-right">{e.plan.levers.length ? e.plan.levers.join(", ") : "none"}</td><td className="text-right">{(e.plan.hedge * 100).toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-6 text-lg font-semibold">Assumptions register</h2>
      <table className="mt-2 w-full text-sm tabular-nums">
        <thead><tr className="text-left"><th className="py-1">Lever</th><th className="text-right">Potential (kt/yr)</th><th className="text-right">₹/t</th><th className="text-right">Delivery</th><th className="pl-4 text-left">Source</th></tr></thead>
        <tbody>
          {result.s.levers.map((l) => (
            <tr key={l.id} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="py-1">{l.name}</td><td className="text-right">{(l.potential / 1000).toFixed(1)}</td><td className="text-right">{l.costPerTonne}</td>
              <td className="text-right">{(l.deliveryMean * 100).toFixed(0)}% ± {(l.deliverySd * 100).toFixed(0)}</td><td className="pl-4 text-xs text-zinc-500">Assumption</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-zinc-500">Targets: gazette (8 Oct 2025 / 13 Jan 2026). Price, volatility, banking rule (FY26 surplus carries to FY27, to be confirmed with BEE) and resale haircut 10% are assumptions.</p>
    </div>
  );
}
