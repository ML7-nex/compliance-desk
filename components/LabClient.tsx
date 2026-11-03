"use client";
import { useEffect, useMemo, useState } from "react";
import type { EntityRow } from "@/lib/entities";
import { pct } from "@/lib/entities";
import { PRICE_TABLE, computeOptions, defaultInputs, priceRows, sanitizeInputs, type Option, type PlantInputs } from "@/lib/simple";
import { buildCsv } from "@/lib/export";
import { money, ktText } from "@/lib/format";
import BriefCard from "@/components/BriefCard";
import SimpleForm from "@/components/SimpleForm";
import SimpleCostCurve from "@/components/SimpleCostCurve";
import Collapsible from "@/components/Collapsible";

const DOT: Record<string, string> = { buy: "#8b98aa", abate: "#E69F00", mix: "#3ddc97" };

function describe(o: Option, gapT: number): string {
  const names = (o.uses.length ? o.uses.map((u) => `${u.name} (${ktText(u.tonnes)} at ₹${Math.round(u.costPerTonne).toLocaleString("en-IN")} a tonne)`).join(", ") : "none");
  if (o.key === "buy") return `Do nothing yourself and buy credits for the whole gap: ${ktText(gapT)}.`;
  if (o.key === "abate") return o.possible
    ? `Cut the whole gap yourself, cheapest first, using: ${names}. Buy no credits.`
    : `Not possible with the abatements listed: they can cut only ${ktText(gapT - o.uncoveredT)} of the ${ktText(gapT)} gap.`;
  return o.uses.length
    ? `Use only the abatements that cost less than a credit: ${names}. Then buy credits for the other ${ktText(o.boughtT)}.`
    : `No abatement costs less than a credit at this price, so everything is bought: ${ktText(o.boughtT)}.`;
}

export default function LabClient({ entity }: { entity: EntityRow }) {
  const def = useMemo(() => defaultInputs(entity), [entity]);
  const [price, setPrice] = useState(800);
  const [inputs, setInputs] = useState<PlantInputs>(def);
  const key = `simple:${entity.reg}`;

  // Restore this plant's saved inputs from the browser (storage can be blocked, so never rely on it).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setInputs(sanitizeInputs(JSON.parse(raw), def));
    } catch { /* storage unavailable: start from defaults */ }
  }, [key, def]);
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(inputs)); } catch { /* ignore */ }
  }, [key, inputs]);

  const result = useMemo(() => computeOptions(inputs, entity.t27, price), [inputs, entity.t27, price]);
  const prices = useMemo(() => Array.from(new Set([...PRICE_TABLE, price])).sort((a, b) => a - b), [price]);
  const rows = useMemo(() => priceRows(inputs, entity.t27, prices), [inputs, entity.t27, prices]);

  function download() {
    const blob = new Blob([buildCsv(entity, inputs, def, price, result, rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cut-or-buy-${entity.reg}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const userMade = inputs.abatements.length > 0 && inputs.abatements.every((a) => a.source === "User input" || a.edited);
  const best = result.options.find((o) => o.key === result.bestKey);

  return (
    <div className="mt-6">
      <div className="hidden print:block">
        <h2 className="text-xl font-semibold">{entity.name}</h2>
        <p className="text-sm">{entity.reg} · credit price assumed ₹{price} a tonne</p>
      </div>

      {/* STEP 1 */}
      <section className="card p-5">
        <div className="eyebrow text-accent">Step 1 · How much must be cut</div>
        <p className="mt-2 text-2xl font-semibold leading-snug">
          {result.noGap
            ? <>On these numbers the plant already meets its FY27 limit, so there is no gap to close.</>
            : <>By FY27 this plant has to cut <span className="num text-accent">{ktText(result.gapT)}</span> of CO₂ a year, <span className="num text-accent">{pct(entity.cutPct27)}</span> of its emissions per tonne of cement.</>}
        </p>
        <p className="mt-2 text-sm text-muted">
          The limit comes from the government gazette. Every tonne the plant does not cut itself has to be covered by carbon credits (gazette rule 4(3)).
        </p>
      </section>

      {/* STEP 2 */}
      <section className="no-print card mt-3 p-5">
        <div className="eyebrow text-accent">Step 2 · One choice from you</div>
        <label className="mt-3 block max-w-xl">
          <span className="flex items-baseline justify-between text-sm"><span>What do you expect one carbon credit to cost?</span><span className="num text-lg font-semibold">₹{price} a tonne</span></span>
          <input type="range" min={200} max={2500} step={50} value={price} onChange={(e) => setPrice(+e.target.value)} className="mt-3 w-full" />
          <span className="mt-1 block text-xs text-muted">No credit has traded yet and there is no official price. Analysts expect ₹600 to ₹1,200 early on.</span>
        </label>
      </section>

      {/* STEP 3 */}
      <section className="mt-3" aria-label="What it costs">
        <div className="eyebrow px-1 text-accent">Step 3 · What it costs: three ways to cover the gap</div>
        <div className="mt-2 grid gap-3 md:grid-cols-3">
          {result.options.map((o) => {
            const isBest = o.key === result.bestKey;
            return (
              <div key={o.key} className={`rounded-xl border p-4 ${isBest ? "border-accent/60 bg-accent/10" : "border-line bg-surface"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: DOT[o.key] }} />{o.name}</span>
                  {isBest && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accentink">cheapest</span>}
                </div>
                <div className="num mt-3 text-3xl font-semibold tracking-tight">{o.total == null ? "Not possible" : money(o.total)}</div>
                <p className="mt-1 text-xs text-muted">a year, at ₹{price} a credit</p>
                <p className="mt-3 text-sm text-muted">{describe(o, result.gapT)}</p>
              </div>
            );
          })}
        </div>
        {best && best.key !== "buy" && (
          <p className="mt-3 px-1 text-sm">
            <strong>Reading it:</strong> an abatement is worth doing when it costs less per tonne than a credit. The cheapest way here is &quot;{best.name.toLowerCase()}&quot;{result.options[0].total != null && best.total != null && result.options[0].total > 0
              ? <>: it costs {money(best.total)} against {money(result.options[0].total)} for buying everything.</> : "."}
          </p>
        )}
        <p className="mt-1 px-1 text-xs text-muted">
          {userMade ? "Abatement figures are your own. " : "Abatement costs come from a published cement study (CEEW 2023). How much each can still cut at your plant is a placeholder until you enter it. "}Decision support, not advice.
        </p>
      </section>

      {/* If the price is different */}
      <section className="card mt-3 overflow-x-auto p-5">
        <div className="eyebrow">If the credit price turns out different</div>
        <p className="mt-1 text-sm text-muted">Nobody knows the price yet, so here are the same three costs at other prices. Cutting with abatements does not depend on the credit price.</p>
        <table className="num mt-3 w-full min-w-[520px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted">
            <tr><th className="py-2">Credit price</th><th className="text-right">Buy all the credits</th><th className="text-right">Cut it all with abatements</th><th className="text-right">Abatements first, buy the rest</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.price} className={`border-t border-line ${r.price === price ? "bg-accent/5" : ""}`}>
                <th scope="row" className="py-2 text-left font-medium">₹{r.price.toLocaleString("en-IN")} a tonne{r.price === price ? " (your choice)" : ""}</th>
                <td className="text-right">{money(r.buy)}</td>
                <td className="text-right">{r.abate == null ? "Not possible" : money(r.abate)}</td>
                <td className="text-right font-semibold">{money(r.mix)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="no-print">
        <BriefCard reg={entity.reg} price={price} inputs={inputs} />
      </div>

      <div className="mt-6 text-sm font-semibold text-muted no-print">Go deeper (optional)</div>
      <Collapsible title="Adjust to your plant's real numbers" hint="Your output, your emissions, and how much each abatement can still cut. Saved in this browser only.">
        <SimpleForm def={def} cur={inputs} onChange={setInputs} onReset={() => setInputs(def)} />
      </Collapsible>
      <Collapsible title="Which abatements are worth doing?" hint="Each abatement as a block: how much it can cut and what it costs per tonne, against the credit price.">
        <SimpleCostCurve inputs={inputs} gapT={result.gapT} price={price} />
      </Collapsible>
      <Collapsible title="Assumptions and sources" hint="Where every number comes from.">
        <div className="overflow-x-auto px-5 pb-4 pt-3">
          <table className="num w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted"><tr className="text-left"><th className="py-2">Abatement</th><th className="text-right">Can cut (kt a year)</th><th className="text-right">₹ per tonne</th><th className="pl-4 text-left">Source</th></tr></thead>
            <tbody>
              {inputs.abatements.length === 0 && <tr className="border-t border-line"><td colSpan={4} className="py-3 text-muted">No abatements in this model.</td></tr>}
              {inputs.abatements.map((a) => (
                <tr key={a.id} className={`border-t border-line ${a.enabled ? "" : "opacity-50"}`}>
                  <td className="py-2.5">{a.name}{a.enabled ? "" : " (off)"}</td><td className="text-right">{a.potentialKt.toFixed(1)}</td><td className="text-right">{Math.round(a.costPerTonne).toLocaleString("en-IN")}</td>
                  <td className="pl-4"><span title={a.source} className={`rounded-full border px-2 py-0.5 text-[11px] ${a.edited || a.custom ? "border-accent text-accent" : "border-blue text-blue"}`}>{a.edited || a.custom ? "your input" : "CEEW 2023"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">
            Limit and baseline: MoEFCC gazette G.S.R. 739(E), 8 Oct 2025. Abatement costs: CEEW (2023); two are converted from dollars at an assumed ₹88 per dollar (hover a badge for the full note). How much each abatement can cut at your plant is a placeholder. The credit price is your choice; analysts expect ₹600 to ₹1,200 and there is no official price.
          </p>
        </div>
      </Collapsible>

      <div className="no-print mt-4 flex flex-wrap gap-3">
        <button onClick={download} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accentink transition hover:brightness-110">Download numbers and sources (CSV)</button>
        <button onClick={() => window.print()} className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent">Print / save as PDF</button>
      </div>
    </div>
  );
}
