"use client";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { EntityRow } from "@/lib/entities";
import { kt, pct } from "@/lib/entities";
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
import Collapsible from "@/components/Collapsible";

// One colour per option, colour-blind safe (Okabe–Ito).
const COLORS = ["#8b98aa", "#56B4E9", "#E69F00", "#3ddc97"];
const CAUTION = [
  { label: "Lowest average cost", lambda: 0 },
  { label: "Balanced", lambda: 0.5 },
  { label: "Play it safe", lambda: 2 },
];

function LazyTornado({ entity, inputs, twin, plan }: { entity: EntityRow; inputs: { price: number; vol: number; lambda: number }; twin: TwinState; plan: Parameters<typeof tornado>[3] }) {
  const sens = useMemo(() => tornado(entity, inputs, twin, plan), [entity, inputs, twin, plan]);
  return <Tornado base={sens.base} bars={sens.bars} />;
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

  const hasLevers = result.s.levers.length > 0;
  const names = hasLevers
    ? ["Buy all credits on the market", "Do the cheap fixes, buy the rest", "Cheap fixes + lock in half the price", "Best plan for your caution level"]
    : ["Buy all credits on the market", "Lock in half the price in advance", "Lock in all of it in advance", "Best plan for your caution level"];
  const [spot, , , opt] = result.strategies;
  const maxBad = Math.max(...result.strategies.map((x) => x.e.stats.p95), 1);
  const saving = spot.e.stats.mean - opt.e.stats.mean;
  const badSaving = spot.e.stats.p95 - opt.e.stats.p95;
  const leverNames = opt.e.plan.levers.map((id) => result.s.levers.find((l) => l.id === id)?.name ?? id);
  const others = result.strategies.slice(0, 3).map((x, i) => ({ i, mean: x.e.stats.mean, bad: x.e.stats.p95 }));
  const cheapest = others.reduce((m, x) => (x.mean < m.mean ? x : m), others[0]);
  const cheaperOnAverage = cheapest.mean < opt.e.stats.mean - 1000 && Math.abs(cheapest.bad - opt.e.stats.p95) > 1000 ? cheapest : null;
  const gap27 = Math.max(0, result.gross[1]);
  const userLevers = result.s.levers.filter((l) => l.source === "User input").length;

  const all = result.strategies.flatMap((x) => Array.from(x.e.costs));
  const lo = all.reduce((a, b) => Math.min(a, b), Infinity), hi = all.reduce((a, b) => Math.max(a, b), -Infinity);
  const bins = 48;
  const hist = result.strategies.map(({ e }) => {
    const h = new Array(bins).fill(0);
    for (const c of e.costs) h[Math.min(bins - 1, Math.floor(((c - lo) / (hi - lo || 1)) * bins))]++;
    return h;
  });
  const hmax = Math.max(...hist.flat(), 1);
  const W = 680, H = 200, P = 8;
  const area = (h: number[]) => `M${P},${H} ` + h.map((v, i) => `L${P + (i / (bins - 1)) * (W - 2 * P)},${H - (v / hmax) * (H - 14)}`).join(" ") + ` L${W - P},${H} Z`;

  function download() {
    const blob = new Blob([buildCsv(entity, inputs, deferredTwin, def, result)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `strategy-lab-${entity.reg}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mt-6" aria-busy={stale}>
      <div className="hidden print:block">
        <h2 className="text-xl font-semibold">{entity.name}</h2>
        <p className="text-sm">{entity.reg} · price ₹{price}/t · {CAUTION.find((c) => c.lambda === lambda)?.label}</p>
      </div>

      {/* STEP 1: the gap */}
      <section className="card p-5">
        <div className="eyebrow text-accent">Step 1 · Your gap</div>
        <p className="mt-2 text-2xl font-semibold leading-snug">
          {gap27 > 0
            ? <>By FY27 this plant has to cut <span className="num text-accent">{pct(entity.cutPct27)}</span> of its emissions intensity, a gap of about <span className="num text-accent">{ktText(gap27)}</span> of CO₂ a year.</>
            : <>On these inputs the plant already meets its FY27 target, with no gap to close.</>}
        </p>
        <p className="mt-2 text-sm text-muted">
          Any tonne it does not cut itself must be covered by buying carbon credits, or it pays a penalty of twice the credit price. Nobody knows the credit price yet, so the tool tests thousands of possible prices.
        </p>
      </section>

      {/* STEP 2: the one assumption that matters + caution */}
      <section className="no-print card mt-3 p-5">
        <div className="eyebrow text-accent">Step 2 · Two choices from you</div>
        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="flex items-baseline justify-between text-sm"><span>What do you expect a credit to cost?</span><span className="num text-lg font-semibold">₹{price} per tonne</span></span>
            <input type="range" min={200} max={2500} step={50} value={price} onChange={(e) => setPrice(+e.target.value)} className="mt-3 w-full" />
            <span className="mt-1 block text-xs text-muted">Nothing has traded yet. Analysts expect ₹600–1,200 early on; there is no official price.</span>
          </label>
          <div>
            <span className="text-sm">How cautious should the plan be?</span>
            <div role="group" aria-label="How cautious should the plan be" className="mt-3 flex flex-wrap gap-2">
              {CAUTION.map((c) => (
                <button key={c.label} onClick={() => setLambda(c.lambda)} aria-pressed={lambda === c.lambda}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${lambda === c.lambda ? "border-accent bg-accent text-accentink" : "border-line text-muted hover:text-ink"}`}>{c.label}</button>
              ))}
            </div>
            <span className="mt-2 block text-xs text-muted">&ldquo;Play it safe&rdquo; accepts a slightly higher average cost to avoid a very bad year.</span>
          </div>
        </div>
      </section>

      {/* STEP 3: the answer */}
      <section className={`mt-3 rounded-xl border border-accent/40 bg-accent/10 p-5 transition-opacity ${stale ? "opacity-60" : ""}`}>
        <div className="eyebrow text-accent">Step 3 · What to do</div>
        <ul className="mt-3 space-y-2 text-lg leading-snug">
          {hasLevers && (
            <li>{leverNames.length > 0
              ? <>Do these first: <strong>{leverNames.join(", ")}</strong>.</>
              : <>None of the abatement levers is worth doing at this credit price.</>}</li>
          )}
          <li>{opt.e.plan.hedge > 0
            ? <>Lock in a price in advance for about <strong>{Math.round(opt.e.plan.hedge * 100)}%</strong> of whatever gap remains.</>
            : <>Buy the remaining credits as you go, with no advance contract.</>}</li>
          <li>
            Expected cost <strong className="num">{money(opt.e.stats.mean)}</strong>
            {saving > 1000 ? <> instead of <span className="num">{money(spot.e.stats.mean)}</span> if you simply bought everything</> : null}.
            {" "}In a bad year (1 in 20) about <strong className="num">{money(opt.e.stats.p95)}</strong>{badSaving > 1000 ? <> instead of <span className="num">{money(spot.e.stats.p95)}</span></> : null}.
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted">
          {userLevers === result.s.levers.length && hasLevers ? "Lever figures are your own. " : hasLevers ? "Fix costs come from a published cement study (CEEW 2023); how much each fix can still deliver at your plant is an illustrative placeholder until you enter it. " : ""}
          Decision support, not advice.
        </p>
      </section>

      {/* Compare options */}
      <section className="card mt-3 p-5" aria-label="Compare your options">
        <div className="eyebrow">Compare your options</div>
        <ul className="mt-3 space-y-3">
          {result.strategies.map(({ e }, i) => (
            <li key={i} className={`rounded-lg border p-3 ${i === 3 ? "border-accent/50 bg-accent/5" : "border-line"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium"><i className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: COLORS[i] }} />{names[i]}{i === 3 && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accentink">recommended</span>}</span>
                <span className="num text-sm text-muted">expected <strong className="text-ink">{money(e.stats.mean)}</strong> · bad year <strong className="text-ink">{money(e.stats.p95)}</strong></span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-surface2"><div className="h-1.5 rounded-full" style={{ width: `${Math.max(2, (e.stats.p95 / maxBad) * 100)}%`, background: COLORS[i] }} /></div>
            </li>
          ))}
        </ul>
        {cheaperOnAverage && (
          <p className="mt-3 rounded-lg bg-surface2 p-3 text-sm">
            Why is the recommended plan not the cheapest on average? &ldquo;{names[cheaperOnAverage.i]}&rdquo; costs {money(opt.e.stats.mean - cheaperOnAverage.mean)} less on average, but its bad year is {money(cheaperOnAverage.bad - opt.e.stats.p95)} {cheaperOnAverage.bad > opt.e.stats.p95 ? "worse" : "better"}. You chose &ldquo;{CAUTION.find((c) => c.lambda === lambda)?.label ?? "Balanced"}&rdquo;, so the plan gives up a little average cost for a safer bad year. Pick &ldquo;Lowest average cost&rdquo; to see the cheapest-on-average plan.
          </p>
        )}
        <p className="mt-3 text-xs text-muted">The bar shows the bad-year cost. &ldquo;Expected&rdquo; is the average over 10,000 simulated credit-price paths. A bad year is the cost that is exceeded only 1 time in 20.</p>
      </section>

      <div className="no-print">
        <BriefCard reg={entity.reg} price={price} vol={vol} lambda={lambda} twin={twin} />
      </div>

      {/* Everything else, one click away */}
      <div className="mt-6 text-sm font-semibold text-muted no-print">Go deeper (optional)</div>
      <Collapsible title="Adjust to your plant's real numbers" hint="Production, emissions and the cheap-fix potential only you know. Saved in this browser only.">
        <TwinForm entity={entity} def={def} twin={twin} onChange={setTwin} onReset={() => setTwin(def)} />
        <div className="px-5 pb-2">
          <label className="mt-2 block max-w-sm text-sm">
            <span className="flex justify-between"><span className="text-muted">Price volatility</span><span className="num font-semibold">{(vol * 100).toFixed(0)}%</span></span>
            <input type="range" min={0.1} max={0.9} step={0.05} value={vol} onChange={(e) => setVol(+e.target.value)} className="mt-2 w-full" />
          </label>
        </div>
      </Collapsible>
      <Collapsible title="Which fixes are worth doing?" hint="Each fix as a block: how much it cuts and what it costs per tonne, against the credit price.">
        <CostCurve s={result.s} shortfall27={gap27} />
      </Collapsible>
      <Collapsible title="What could change the answer?" hint="Which assumption moves the expected cost the most.">
        <LazyTornado entity={entity} inputs={inputs} twin={deferredTwin} plan={result.best.plan} />
      </Collapsible>
      <Collapsible title="Credit price scenarios and risk" hint="The range of prices tested, and how the cost of each option is spread out.">
        <PriceBands d={result.d} meanPrice={result.s.market.meanPrice} />
        <div className="px-5 pb-3">
          <svg role="img" aria-label="Distribution of simulated total cost per option" viewBox={`0 0 ${W} ${H + 24}`} className="mt-3 w-full">
            {hist.map((h, si) => <path key={si} d={area(h)} fill={COLORS[si]} fillOpacity={si === 3 ? 0.35 : 0.1} stroke={COLORS[si]} strokeWidth={si === 3 ? 2.2 : 1.4} />)}
            <text x={P} y={H + 16} fontSize="11" fill="var(--muted)">{money(lo)}</text>
            <text x={W - P} y={H + 16} fontSize="11" textAnchor="end" fill="var(--muted)">{money(hi)}</text>
          </svg>
          <p className="mt-1 text-xs text-muted">Each curve is one option. The further left and narrower, the cheaper and safer. Green is the recommended plan. Costs are discounted at {(deferredTwin.discountRate * 100).toFixed(0)}%.</p>
        </div>
      </Collapsible>
      <Collapsible title="Assumptions and sources" hint="Where every number comes from.">
        <div className="overflow-x-auto px-5 pb-3">
          <table className="num w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted"><tr className="text-left"><th className="py-2">Fix</th><th className="text-right">Can cut (kt/yr)</th><th className="text-right">₹ per t</th><th className="text-right">Delivery</th><th className="pl-4 text-left">Source</th></tr></thead>
            <tbody>
              {result.s.levers.length === 0 && <tr className="border-t border-line"><td colSpan={5} className="py-3 text-muted">No abatement levers in this model.</td></tr>}
              {result.s.levers.map((l) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="py-2.5">{l.name}</td><td className="text-right">{(l.potential / 1000).toFixed(1)}</td><td className="text-right">{l.costPerTonne}</td>
                  <td className="text-right">{(l.deliveryMean * 100).toFixed(0)}% ± {(l.deliverySd * 100).toFixed(0)}</td>
                  <td className="pl-4"><span title={l.source} className={`rounded-full border px-2 py-0.5 text-[11px] ${l.source === "User input" ? "border-accent text-accent" : l.source.startsWith("CEEW") ? "border-blue text-blue" : "border-warn/40 text-warn"}`}>{l.source === "User input" ? "your input" : l.source.startsWith("CEEW") ? "CEEW 2023" : "assumption"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">Targets: gazette. Fix costs: CEEW (2023), converted at ₹88/USD (hover a badge for the full note); how much each can still deliver is illustrative. Price and volatility are assumptions. Banking of FY26 surplus into FY27 is {deferredTwin.banking ? "on (allowed under current rules per secondary sources)" : "switched off"}; borrowing from future years is not allowed. Penalty = 2× the average credit price.</p>
        </div>
      </Collapsible>

      <div className="no-print mt-4 flex flex-wrap gap-3">
        <button onClick={download} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accentink transition hover:brightness-110">Download numbers and sources (CSV)</button>
        <button onClick={() => window.print()} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent">Print / save as PDF</button>
      </div>
      <p className="hidden print:block mt-3 text-xs">Plant: {kt(entity.cut27)} to cut by FY27. Decision support, not advice.</p>
    </div>
  );
}
