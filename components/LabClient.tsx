"use client";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { EntityRow } from "@/lib/entities";
import { computeLab } from "@/lib/lab";
import { tornado } from "@/lib/sensitivity";
import { buildCsv } from "@/lib/export";
import { money, ktText } from "@/lib/format";
import { defaultTwin, sanitizeTwin, type TwinState } from "@/lib/twin";
import BriefCard from "@/components/BriefCard";
import TwinForm from "@/components/TwinForm";
import CostCurve from "@/components/CostCurve";
import PriceBands from "@/components/PriceBands";
import Tornado from "@/components/Tornado";

const cr = money;
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
  const def = useMemo(() => defaultTwin(entity), [entity]);
  const [price, setPrice] = useState(800);
  const [vol, setVol] = useState(0.4);
  const [lambda, setLambda] = useState(0.5);
  const [twin, setTwin] = useState<TwinState>(def);
  const key = `twin:${entity.reg}`;

  // Restore this plant's saved inputs from the browser (storage can be blocked, so never rely on it).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setTwin(sanitizeTwin(JSON.parse(raw), def));
    } catch { /* storage unavailable: start from defaults */ }
  }, [key, def]);
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(twin)); } catch { /* ignore */ }
  }, [key, twin]);

  const inputs = useDeferredValue({ price, vol, lambda });
  const deferredTwin = useDeferredValue(twin);
  const stale = inputs.price !== price || inputs.vol !== vol || inputs.lambda !== lambda || deferredTwin !== twin;

  const result = useMemo(() => computeLab(entity, inputs, deferredTwin), [entity, inputs, deferredTwin]);
  const sens = useMemo(() => tornado(entity, inputs, deferredTwin, result.best.plan), [entity, inputs, deferredTwin, result.best.plan]);

  const all = result.strategies.flatMap((x) => Array.from(x.e.costs));
  const lo = all.reduce((a, b) => Math.min(a, b), Infinity), hi = all.reduce((a, b) => Math.max(a, b), -Infinity);
  const bins = 48;
  const hist = result.strategies.map(({ e }) => {
    const h = new Array(bins).fill(0);
    for (const c of e.costs) h[Math.min(bins - 1, Math.floor(((c - lo) / (hi - lo || 1)) * bins))]++;
    return h;
  });
  const hmax = Math.max(...hist.flat(), 1);
  const W = 680, H = 220, P = 8;
  const x = (v: number) => P + ((v - lo) / (hi - lo || 1)) * (W - 2 * P);
  const [spot, , , opt] = result.strategies;
  const saving = spot.e.stats.p95 - opt.e.stats.p95;
  const extra = opt.e.stats.mean - spot.e.stats.mean;
  const area = (h: number[]) =>
    `M${P},${H} ` + h.map((v, i) => `L${P + (i / (bins - 1)) * (W - 2 * P)},${H - (v / hmax) * (H - 14)}`).join(" ") + ` L${W - P},${H} Z`;

  function download() {
    const blob = new Blob([buildCsv(entity, inputs, deferredTwin, def, result)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `strategy-lab-${entity.reg}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const userLevers = result.s.levers.filter((l) => l.source === "User input").length;

  return (
    <div className="mt-6" aria-busy={stale}>
      <div className="hidden print:block">
        <h2 className="text-xl font-semibold">{entity.name}</h2>
        <p className="text-sm">{entity.reg} · price ₹{price}/t, volatility {(vol * 100).toFixed(0)}%, λ {lambda.toFixed(1)}</p>
      </div>
      <p className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
        Decision support, not advice. {userLevers === result.s.levers.length && result.s.levers.length > 0 ? "Lever figures are your own. " : "Default lever costs come from the CEEW (2023) cement cost curve; lever potentials are illustrative until you enter your plant's real headroom. "}No CCC has traded: price is a scenario (public analyst commentary expects ₹600–1,200 per tonne early on; no official floor or ceiling).
      </p>

      <div className="no-print mt-4 grid gap-3 sm:grid-cols-3">
        <Slider label="Expected CCC price, FY26 (analyst range ₹600–1,200)" value={price} display={`₹${price}/t`} min={200} max={2500} step={50} onChange={setPrice} />
        <Slider label="Price volatility" value={vol} display={`${(vol * 100).toFixed(0)}%`} min={0.1} max={0.9} step={0.05} onChange={setVol} />
        <Slider label="Risk aversion λ" value={lambda} display={lambda.toFixed(1)} min={0} max={3} step={0.1} onChange={setLambda} />
      </div>

      <div className={`mt-4 rounded-xl border border-accent/40 bg-accent/10 p-5 transition-opacity ${stale ? "opacity-60" : ""}`}>
        <div className="eyebrow text-accent">Recommendation</div>
        <p className="mt-2 text-xl font-semibold leading-snug">
          {saving > 1000
            ? <>Optimised plan removes <span className="num text-accent">{cr(saving)}</span> from the bad-year (P95) cost{extra > 0 ? <> for <span className="num">{cr(extra)}</span> more in an average year.</> : <> and costs less on average too.</>}</>
            : <>At these settings, buying on the market is already the cheapest plan.</>}
        </p>
        <p className="num mt-2 text-sm text-muted">
          Gross shortfall before action: FY26 {ktText(result.gross[0])}, FY27 {ktText(result.gross[1])} · {result.s.paths.toLocaleString("en-IN")} paths · seed {result.s.seed}
          {opt.e.plan.levers.length > 0 && <> · plan: {opt.e.plan.levers.map((id) => result.s.levers.find((l) => l.id === id)?.name ?? id).join(", ")}, {(opt.e.plan.hedge * 100).toFixed(0)}% hedged</>}
        </p>
      </div>

      <div className="no-print">
        <TwinForm entity={entity} def={def} twin={twin} onChange={setTwin} onReset={() => setTwin(def)} />
        <BriefCard reg={entity.reg} price={price} vol={vol} lambda={lambda} twin={twin} />
      </div>

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
        <p className="mt-2 text-xs text-muted">NPV at {(deferredTwin.discountRate * 100).toFixed(0)}% discount rate. Dashed lines mark the 95th-percentile cost for the first and optimised strategies.</p>
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
                <td className="px-4 text-right text-muted">{e.plan.levers.length ? e.plan.levers.map((id) => result.s.levers.find((l) => l.id === id)?.name ?? id).join(", ") : "none"}</td><td className="px-4 text-right text-muted">{(e.plan.hedge * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <CostCurve s={result.s} shortfall27={Math.max(0, result.gross[1])} />
      <PriceBands d={result.d} meanPrice={result.s.market.meanPrice} />
      <Tornado base={sens.base} bars={sens.bars} />

      <section className="card mt-4 overflow-x-auto p-1">
        <div className="px-4 pt-4"><div className="eyebrow">Assumptions register</div></div>
        <table className="num mt-2 w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted"><tr className="text-left"><th className="px-4 py-2">Lever</th><th className="px-4 text-right">Potential kt/yr</th><th className="px-4 text-right">₹/t</th><th className="px-4 text-right">Delivery</th><th className="px-4 text-left">Source</th></tr></thead>
          <tbody>
            {result.s.levers.length === 0 && <tr className="border-t border-line"><td colSpan={5} className="px-4 py-3 text-muted">No abatement levers in this model.</td></tr>}
            {result.s.levers.map((l) => (
              <tr key={l.id} className="border-t border-line">
                <td className="px-4 py-2.5">{l.name}</td><td className="px-4 text-right">{(l.potential / 1000).toFixed(1)}</td><td className="px-4 text-right">{l.costPerTonne}</td>
                <td className="px-4 text-right">{(l.deliveryMean * 100).toFixed(0)}% ± {(l.deliverySd * 100).toFixed(0)}</td>
                <td className="px-4"><span title={l.source} className={`rounded-full border px-2 py-0.5 text-[11px] ${l.source === "User input" ? "border-accent text-accent" : l.source.startsWith("CEEW") ? "border-blue text-blue" : "border-warn/40 text-warn"}`}>{l.source === "User input" ? "your input" : l.source.startsWith("CEEW") ? "CEEW 2023" : "assumption"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 pb-4 pt-2 text-xs text-muted">Targets: gazette. Lever costs: CEEW (2023), converted at ₹88/USD (hover a badge for the full note); potentials are illustrative. Price, volatility and a 10% resale haircut are assumptions. Banking of FY26 surplus into FY27 is {deferredTwin.banking ? "on (allowed under current rules per secondary sources)" : "switched off"}; borrowing from future years is not allowed. Penalty = 2× the average CCC price.</p>
      </section>

      <div className="no-print mt-4 flex flex-wrap gap-3">
        <button onClick={download} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accentink transition hover:brightness-110">Download assumptions &amp; results (CSV)</button>
        <button onClick={() => window.print()} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent">Print / save as PDF</button>
      </div>
    </div>
  );
}
