import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { entities, allEntities, kt } from "@/lib/entities";
import { computeLab } from "@/lib/lab";
import { defaultTwin } from "@/lib/twin";
import { money } from "@/lib/format";

export const metadata = { title: `Impact & Market | ${BRAND}`, description: "How big is the problem for cement plants, who pays for a solution, and what the tool changes." };

const PRICES = [600, 800, 1200]; // ₹/t: analyst range (unnamed analysts, IMPRI Jul 2026; Reclimatize Apr 2026); no official price exists
const crore = (rupees: number) => rupees / 1e7;
const fmtCr = (x: number) => `₹${Math.round(x).toLocaleString("en-IN")} cr`;

export default function ImpactPage() {
  const groups = [
    { label: "Integrated plants", rows: entities.filter((e) => e.reg.startsWith("CMT")) },
    { label: "Grinding units", rows: entities.filter((e) => !e.reg.startsWith("CMT")) },
  ].map((g) => ({ ...g, n: g.rows.length, cut: g.rows.reduce((a, r) => a + r.cut27, 0) }));
  const totalCut = groups.reduce((a, g) => a + g.cut, 0);
  const n = entities.length;
  const baseTotal = entities.reduce((a, r) => a + r.baseEmissions, 0);
  const cuts = entities.map((e) => e.cut27).sort((a, b) => a - b);
  const medianCut = cuts[Math.floor(cuts.length / 2)];
  const feeLakh = [2, 5];

  // Worked example: how the answer shrinks as the plant's cheap headroom shrinks.
  const ex = entities.find((e) => e.reg === "CMTOE084RJ") ?? entities[0];
  const rows = [1, 0.5, 0.25, 0].map((f) => {
    const t = defaultTwin(ex);
    t.levers = t.levers.map((l) => ({ ...l, potentialKt: l.potentialKt * f }));
    const lab = computeLab(ex, { price: 800, vol: 0.4, lambda: 0.5 }, t);
    const [buy, , , opt] = lab.strategies;
    return { f, buy: buy.e.stats.mean, opt: opt.e.stats.mean, optP95: opt.e.stats.p95 };
  });

  const card = "card p-5";
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="eyebrow text-accent">Impact &amp; market</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">How big is the problem for cement, and what does the tool change?</h1>
      <p className="mt-3 max-w-3xl text-muted">
        Every number below is computed from the gazette data in the atlas or taken from a cited source. Scenarios are labelled as scenarios. Nothing here is a forecast.
      </p>

      <section className={`${card} mt-8`}>
        <div className="eyebrow">1 · The problem</div>
        <h2 className="mt-1 text-xl font-semibold">{n} cement plants face a legally binding cut of {(totalCut / 1e6).toFixed(1)} Mt a year by FY27</h2>
        <p className="mt-2 text-sm text-muted">
          If a plant did nothing and covered its whole gap by buying credits, this is the most it could owe. Real plants abate cheaply first, so treat these as <strong className="text-ink">upper bounds</strong>, not expected costs.
          The price is a scenario: no credit has traded and no official floor or ceiling exists. Analyst commentary expects early prices around ₹600–1,200 per tonne.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="num w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted">
              <tr><th className="py-2">Cement</th><th className="text-right">Plants</th><th className="text-right">Cut by FY27</th>{PRICES.map((p) => <th key={p} className="text-right">At ₹{p}/t</th>)}</tr>
            </thead>
            <tbody>
              {groups.map((r) => (
                <tr key={r.label} className="border-t border-line">
                  <td className="py-2">{r.label}</td>
                  <td className="text-right">{r.n}</td><td className="text-right">{kt(r.cut)}</td>
                  {PRICES.map((p) => <td key={p} className="text-right">{fmtCr(crore(r.cut * p))}</td>)}
                </tr>
              ))}
              <tr className="border-t border-line font-semibold">
                <td className="py-2">All cement</td><td className="text-right">{n}</td><td className="text-right">{kt(totalCut)}</td>
                {PRICES.map((p) => <td key={p} className="text-right">{fmtCr(crore(totalCut * p))}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">Computed per plant as (baseline intensity − FY27 target) × baseline output. Cement targets come from the 8 Oct 2025 gazette.</p>
      </section>

      <section className={`${card} mt-4`}>
        <div className="eyebrow">2 · Is the data right?</div>
        <h2 className="mt-1 text-xl font-semibold">An independent report reproduces our cement numbers</h2>
        <p className="mt-2 text-sm text-muted">
          The ACEEE technical report (2026) states that the scheme covers <strong className="text-ink">186 cement entities</strong> (131 integrated, 55 grinding) with a combined cut of <strong className="text-ink">7.179 Mt a year</strong> by FY2026-27.
          The atlas, built only from the gazette, has <strong className="text-ink">{n} entities</strong> ({groups[0].n} integrated, {groups[1].n} grinding) and computes <strong className="text-ink">{(totalCut / 1e6).toFixed(2)} Mt</strong>. We did not tune anything to match.
        </p>
      </section>

      <section className={`${card} mt-4`}>
        <div className="eyebrow">3 · The decision a plant actually faces</div>
        <h2 className="mt-1 text-xl font-semibold">The right answer depends on cheap headroom the plant may or may not have</h2>
        <p className="mt-2 text-sm text-muted">
          CEEW (2023) finds that 13 cement measures (nine efficiency, one raw-material, three clinker-factor) have a <em>negative</em> abatement cost and could cut the sector&apos;s emissions intensity by about 20%.
          The cement targets ask for about {((totalCut / baseTotal) * 100).toFixed(1)}% of baseline emissions by FY27.
          So plants that have <strong className="text-ink">not</strong> yet used those measures can meet their limit cheaply, and plants that already have must buy credits or use costlier levers such as alternative fuels (about USD 42/tCO₂).
          That is a decision each plant has to price for itself.
        </p>
        <h3 className="mt-5 text-sm font-semibold">Worked example: {ex.name.split(",").slice(0, 2).join(",")} ({ex.reg})</h3>
        <p className="mt-1 text-xs text-muted">Gross shortfall by FY27 {kt(ex.cut27)}. Credit price ₹800/t (scenario), 40% volatility, CEEW lever costs. Only the plant&apos;s cheap headroom changes between rows.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="num w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted">
              <tr><th className="py-2">Cheap headroom the plant still has</th><th className="text-right">Buy everything: expected</th><th className="text-right">Best plan: expected</th><th className="text-right">Best plan: bad year (1 in 20)</th><th className="text-right">Expected saving</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.f} className="border-t border-line">
                  <td className="py-2">{r.f === 1 ? "As modelled (100%)" : r.f === 0 ? "None (0%)" : `${r.f * 100}% of modelled`}</td>
                  <td className="text-right">{money(r.buy)}</td><td className="text-right">{money(r.opt)}</td><td className="text-right text-muted">{money(r.optP95)}</td>
                  <td className="text-right font-semibold text-accent">{r.buy > 0 ? `${Math.max(0, Math.round((1 - r.opt / r.buy) * 100))}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm">
          <strong>Reading it:</strong> the saving is large if the plant has headroom and shrinks to a pricing-and-hedging benefit if it does not. This is why the tool asks the plant to enter its real headroom. The first row is illustrative, not a forecast for this plant.
        </p>
      </section>

      <section className={`${card} mt-4`}>
        <div className="eyebrow">4 · Commercial potential</div>
        <h2 className="mt-1 text-xl font-semibold">Who pays, and how a fee compares with the exposure</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li><strong className="text-ink">Cement plants (finance or sustainability lead):</strong> {n} plants. The median plant must cut {kt(medianCut)} by FY27, an upper-bound exposure of {money(medianCut * 800)} a year at ₹800/t.</li>
          <li><strong className="text-ink">ESG and carbon consultancies:</strong> use the engine to serve more clients per analyst (white-label).</li>
          <li><strong className="text-ink">Banks and lenders:</strong> see a borrower&apos;s carbon exposure from the public atlas before asking for any data.</li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          <strong className="text-ink">Pricing hypothesis (untested):</strong> an annual per-plant licence of ₹{feeLakh[0]}–{feeLakh[1]} lakh. Across all {n} cement plants that is about {fmtCr((n * feeLakh[0]) / 100)}–{fmtCr((n * feeLakh[1]) / 100)} a year before consultancies and banks.
          Against the median plant&apos;s upper-bound exposure of {money(medianCut * 800)}, a ₹{feeLakh[1]} lakh fee is {((feeLakh[1] * 1e5 / (medianCut * 800)) * 100).toFixed(1)}% of it. A pilot has to establish the real willingness to pay.
        </p>
      </section>

      <section className={`${card} mt-4`}>
        <div className="eyebrow">5 · Measurable impact and how it scales</div>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li><strong className="text-ink">Transparency:</strong> {n} binding cement targets, previously only in a gazette PDF, are now searchable and traceable to the source page.</li>
          <li><strong className="text-ink">Financial efficiency:</strong> the table above is the measurable claim: expected cost with and without a priced plan, as a function of the plant&apos;s headroom.</li>
          <li><strong className="text-ink">Emissions:</strong> the tool does not itself cut emissions. The scheme does. The tool helps plants find the cheapest route to meet their limit, which makes ambitious abatement choices easier to justify to a board.</li>
          <li><strong className="text-ink">Scale path:</strong> the engine is sector-agnostic and our data already holds all {allEntities.length} notified plants. Other sectors (aluminium, refineries, textiles and more) can follow once their abatement costs are sourced, as they were for cement.</li>
          <li><strong className="text-ink">AI-native:</strong> built with Claude Code (code, tests, data extraction). Gemini turns each result into a plain-English brief, and a checker flags any figure it cannot trace to the simulation.</li>
        </ul>
      </section>

      <section className={`${card} mt-4 text-sm`}>
        <div className="eyebrow">Sources</div>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
          <li>MoEFCC gazette G.S.R. 739(E), 8 Oct 2025 (cement targets).</li>
          <li><a className="text-accent underline" href="https://www.ceew.in/publications/how-can-india-decarbonise-for-net-zero-cement-industry">CEEW, Evaluating Net-zero for the Indian Cement Industry (Oct 2023)</a>: abatement cost curve; costs in USD, converted at an assumed ₹88/USD.</li>
          <li><a className="text-accent underline" href="https://aeee.in/wp-content/uploads/2026/07/decarbonisation-in-cement-industry.pdf">ACEEE, Decarbonisation in the Indian Cement Industry (2026)</a>: 186 cement entities and 7.179 Mt cut.</li>
          <li><a className="text-accent underline" href="https://www.impriindia.com/insights/policy-update/carbon-credit-trading-scheme-ccts-2/">IMPRI (28 Jul 2026)</a> and <a className="text-accent underline" href="https://reclimatize.in/india-ccc-carbon-credit-market-ccts-trading/">Reclimatize (7 Apr 2026)</a>: analyst price range ₹600–1,200 (unnamed analysts, not official); banking allowed, borrowing not (secondary source).</li>
        </ul>
        <p className="mt-4"><Link href="/lab" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accentink">Open the Strategy Lab →</Link></p>
      </section>
    </main>
  );
}
