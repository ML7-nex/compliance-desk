"use client";
import { useMemo, useState } from "react";
import type { EntityRow } from "@/lib/entities";
import { computeLab } from "@/lib/lab";
import BriefCard from "@/components/BriefCard";

const cr = (x: number) => `₹${(x / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 1 })} cr`;
// One colour per strategy, colour-blind safe (Okabe–Ito), used everywhere.
const COLORS = ["#8b98aa", "#56B4E9", "#E69F00", "#3ddc97"];

function Slider({ label, value, display, min, max, step, onChange }: { label: string; value: number; display: string; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="card block p-4">
      <span className="flex items-baseline justify-between text-sm"><span className="text-muted">{label}</span><span className="num text-lg font-semibold">{display}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-3 w-full" />
    </label>
  );
}

export default function LabClient({ entity }: { entity: EntityRow }) {
  const [price, setPrice] = useState(800);
  const [vol, setVol] = useState(0.4);
  const [lambda, setLambda] = useState(0.5);

  const result = useMemo(() => computeLab(entity, { price, vol, lambda }), [entity, price, vol, lambda]);

  const all = result.strategies.flatMap((x) => Array.from(x.e.costs));
  const lo = Math.min(...all), hi = Math.max(...all);
  const bins = 48;
  const hist = result.strategies.map(({ e }) => {
    const h = new Array(bins).fill(0);
    for (const c of e.costs) h[Math.min(bins - 1, Math.floor(((c - lo) / (hi - lo || 1)) * bins))]++;
    return h;
  });
  const hmax = Math.max(...hist.flat());
  const W = 680, H = 220, P = 8;
  const x = (v: number) => P + ((v - lo) / (hi - lo || 1)) * (W - 2 * P);
  const [spot, , , opt] = result.strategies;
  const saving = spot.e.stats.p95 - opt.e.stats.p95;
  const extra = opt.e.stats.mean - spot.e.stats.mean;
  const area = (h: number[]) =>
    `M${P},${H} ` + h.map((v, i) => `L${P + (i / (bins - 1)) * (W - 2 * P)},${H - (v / hmax) * (H - 14)}`).join(" ") + ` L${W - P},${H} Z`;

  return (
    <div className="mt-6">
      <p className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
        Illustrative. Business-as-usual intensity equals the 2023-24 baseline, lever costs and potentials are uncited placeholders, and no CCC price exists yet. Not advice.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Slider label="Expected CCC price, FY26" value={price} display={`₹${price}/t`} min={200} max={2500} step={50} onChange={setPrice} />
        <Slider label="Price volatility" value={vol} display={`${(vol * 100).toFixed(0)}%`} min={0.1} max={0.9} step={0.05} onChange={setVol} />
        <Slider label="Risk aversion λ" value={lambda} display={lambda.toFixed(1)} min={0} max={3} step={0.1} onChange={setLambda} />
      </div>

      <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-5">
        <div className="eyebrow text-accent">Recommendation</div>
        <p className="mt-2 text-xl font-semibold leading-snug">
          {saving > 0
            ? <>Optimised plan removes <span className="num text-accent">{cr(saving)}</span> from the bad-year (P95) cost{extra > 0 ? <> for <span className="num">{cr(extra)}</span> more in an average year.</> : <> and costs less on average too.</>}</>
            : <>At these settings, buying on the market is already the cheapest plan.</>}
        </p>
        <p className="num mt-2 text-sm text-muted">
          Gross shortfall before action: FY26 {(result.gross[0] / 1000).toFixed(0)} kt, FY27 {(result.gross[1] / 1000).toFixed(0)} kt · {result.s.paths.toLocaleString("en-IN")} paths · seed {result.s.seed}
        </p>
      </div>

      <BriefCard reg={entity.reg} price={price} vol={vol} lambda={lambda} />

      <section className="card mt-4 p-5">
        <div className="eyebrow">Risk</div>
        <h2 className="mt-1 text-lg font-semibold">Total cost distribution by strategy</h2>
        <svg role="img" aria-label="Distribution of simulated total cost per strategy" viewBox={`0 0 ${W} ${H + 28}`} className="mt-3 w-full">
          {hist.map((h, si) => <path key={si} d={area(h)} fill={COLORS[si]} fillOpacity={si === 3 ? 0.35 : 0.1} stroke={COLORS[si]} strokeWidth={si === 3 ? 2.2 : 1.4} />)}
          {[0, 3].map((si) => (
            <g key={si}>
              <line x1={x(result.strategies[si].e.stats.p95)} x2={x(result.strategies[si].e.stats.p95)} y1={4} y2={H} stroke={COLORS[si]} strokeDasharray="4 4" />
              <text x={x(result.strategies[si].e.stats.p95)} y={si === 0 ? 14 : 28} fontSize="10" textAnchor="start" dx={5} fill={COLORS[si]}>{si === 0 ? "P95 buy-all" : "P95 optimised"}</text>
            </g>
          ))}
          <text x={P} y={H + 18} fontSize="11" fill="var(--muted)">{cr(lo)}</text>
          <text x={W - P} y={H + 18} fontSize="11" textAnchor="end" fill="var(--muted)">{cr(hi)}</text>
        </svg>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
          {result.strategies.map((s, i) => <li key={s.name} className="flex items-center gap-1.5"><i className="inline-block h-2 w-4 rounded-sm" style={{ background: COLORS[i] }} />{s.name}</li>)}
        </ul>
        <p className="mt-2 text-xs text-muted">NPV at 10% discount rate. Dashed lines mark the 95th-percentile cost for the first and optimised strategies.</p>
      </section>

      <section className="card mt-4 overflow-x-auto p-1">
        <table className="num w-full text-sm">
          <caption className="sr-only">Cost summary by strategy</caption>
          <thead className="text-xs uppercase tracking-wider text-muted"><tr className="text-left"><th className="px-4 py-3">Strategy</th><th className="px-4 text-right">Expected</th><th className="px-4 text-right">P5</th><th className="px-4 text-right">P95</th><th className="px-4 text-right">Levers on</th><th className="px-4 text-right">Hedge</th></tr></thead>
          <tbody>
            {result.strategies.map(({ name, e }, i) => (
              <tr key={name} className={`border-t border-line ${i === 3 ? "bg-accent/5" : ""}`}>
                <th scope="row" className="px-4 py-3 text-left font-medium"><i className="mr-2 inline-block h-2 w-4 rounded-sm align-middle" style={{ background: COLORS[i] }} />{name}</th>
                <td className="px-4 text-right">{cr(e.stats.mean)}</td><td className="px-4 text-right text-muted">{cr(e.stats.p5)}</td><td className="px-4 text-right">{cr(e.stats.p95)}</td>
                <td className="px-4 text-right text-muted">{e.plan.levers.length ? e.plan.levers.join(", ") : "none"}</td><td className="px-4 text-right text-muted">{(e.plan.hedge * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card mt-4 overflow-x-auto p-1">
        <div className="px-4 pt-4"><div className="eyebrow">Assumptions register</div></div>
        <table className="num mt-2 w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted"><tr className="text-left"><th className="px-4 py-2">Lever</th><th className="px-4 text-right">Potential kt/yr</th><th className="px-4 text-right">₹/t</th><th className="px-4 text-right">Delivery</th><th className="px-4 text-left">Source</th></tr></thead>
          <tbody>
            {result.s.levers.map((l) => (
              <tr key={l.id} className="border-t border-line">
                <td className="px-4 py-2.5">{l.name}</td><td className="px-4 text-right">{(l.potential / 1000).toFixed(1)}</td><td className="px-4 text-right">{l.costPerTonne}</td>
                <td className="px-4 text-right">{(l.deliveryMean * 100).toFixed(0)}% ± {(l.deliverySd * 100).toFixed(0)}</td>
                <td className="px-4"><span className="rounded-full border border-warn/40 px-2 py-0.5 text-[11px] text-warn">assumption</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 pb-4 pt-2 text-xs text-muted">Targets: gazette. Price, volatility, banking rule (FY26 surplus carries to FY27, to be confirmed with BEE) and a 10% resale haircut are assumptions.</p>
      </section>
    </div>
  );
}
