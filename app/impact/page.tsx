import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { entities, allEntities, kt } from "@/lib/entities";
import { computeOptions, defaultInputs } from "@/lib/simple";
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

  // Worked example: how the answer changes as the plant's cheap abatement shrinks.
  const ex = entities.find((e) => e.reg === "CMTOE084RJ") ?? entities[0];
  const base = defaultInputs(ex);
  const rows = [1, 0.5, 0.25, 0].map((f) => {
    const r = computeOptions({ ...base, abatements: base.abatements.map((a) => ({ ...a, potentialKt: a.potentialKt * f })) }, ex.t27, 800);
    const buy = r.options[0].total as number, mix = r.options[2].total as number;
    return { f, buy, mix, saving: buy > 0 ? Math.round((1 - mix / buy) * 100) : 0 };
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
          If a plant did nothing and covered its whole gap by buying credits, this is the most it could owe. Real plants cut some emissions themselves first, so treat these as <strong className="text-ink">upper bounds</strong>, not expected costs.
          The price is a scenario: no credit has traded and no official price exists. Analyst commentary expects early prices around ₹600–1,200 per tonne.
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
        <h2 className="mt-1 text-xl font-semibold">The answer depends on how many cheap abatements the plant has left</h2>
        <p className="mt-2 text-sm text-muted">
          CEEW (2023) finds that 13 cement measures (nine efficiency, one raw-material, three clinker-factor) have a <em>negative</em> abatement cost, meaning they save money, and could cut the sector&apos;s emissions intensity by about 20%.
          The cement targets ask for about {((totalCut / baseTotal) * 100).toFixed(1)}% of baseline emissions by FY27.
          So plants that have <strong className="text-ink">not</strong> yet used those measures can meet their limit cheaply, and plants that already have must buy credits or use costlier abatements such as alternative fuels (about USD 42/tCO₂).
          That is a decision each plant has to price for itself.
        </p>
        <h3 className="mt-5 text-sm font-semibold">Worked example: {ex.name.split(",").slice(0, 2).join(",")} ({ex.reg})</h3>
        <p className="mt-1 text-xs text-muted">Gap by FY27: {kt(ex.cut27)}. Credit price ₹800 a tonne (a scenario). Abatement costs from CEEW. Only the amount of cheap abatement the plant still has changes between rows.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="num w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted">
              <tr><th className="py-2">Cheap abatement the plant still has</th><th className="text-right">Buy all the credits</th><th className="text-right">Abatements first, buy the rest</th><th className="text-right">Saving</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.f} className="border-t border-line">
                  <td className="py-2">{r.f === 1 ? "As modelled (100%)" : r.f === 0 ? "None (0%)" : `${r.f * 100}% of modelled`}</td>
                  <td className="text-right">{money(r.buy)}</td><td className="text-right">{money(r.mix)}</td>
                  <td className="text-right font-semibold text-accent">{r.saving}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm">
          <strong>Reading it:</strong> the saving is large if the plant still has cheap abatements and falls to nothing if it has none. This is why the tool asks the plant to enter its real figures. The first row is illustrative, not a forecast for this plant.
        </p>
      </section>

      <section className={`${card} mt-4`}>
        <div className="eyebrow">4 · Commercial potential</div>
        <h2 className="mt-1 text-xl font-semibold">Who pays, and how a fee compares with the exposure</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted">
          <li><strong className="text-ink">Cement plants (finance or sustainability lead):</strong> {n} plants. The median plant must cut {kt(medianCut)} by FY27, an upper-bound exposure of {money(medianCut * 800)} a year at ₹800/t.</li>
          <li><strong className="text-ink">ESG and carbon consultancies:</strong> use the tool to serve more clients per analyst (white-label).</li>
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
          <li><strong className="text-ink">Financial efficiency:</strong> the table above is the measurable claim: the cost of buying everything against using cheap abatements first, as a function of how many the plant has left.</li>
          <li><strong className="text-ink">Emissions:</strong> the tool does not itself cut emissions. The scheme does. The tool helps plants find the cheapest route to meet their limit, which makes ambitious abatement choices easier to justify to a board.</li>
          <li><strong className="text-ink">Scale path:</strong> the same sums work for any sector, and our data already holds all {allEntities.length} notified plants. Other sectors (aluminium, refineries, textiles and more) can follow once their abatement costs are sourced, as they were for cement.</li>
          <li><strong className="text-ink">AI-native:</strong> built with Claude Code (code, tests, data extraction). Gemini turns each result into a plain-English brief, and a checker flags any figure it cannot trace to the page&apos;s sums.</li>
        </ul>
      </section>

      <section className={`${card} mt-4 text-sm`}>
        <div className="eyebrow">Sources</div>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
          <li>MoEFCC gazette G.S.R. 739(E), 8 Oct 2025 (cement targets).</li>
          <li><a className="text-accent underline" href="https://www.ceew.in/publications/how-can-india-decarbonise-for-net-zero-cement-industry">CEEW, Evaluating Net-zero for the Indian Cement Industry (Oct 2023)</a>: abatement cost curve; costs in USD, converted at an assumed ₹88/USD.</li>
          <li><a className="text-accent underline" href="https://aeee.in/wp-content/uploads/2026/07/decarbonisation-in-cement-industry.pdf">ACEEE, Decarbonisation in the Indian Cement Industry (2026)</a>: 186 cement entities and 7.179 Mt cut.</li>
          <li><a className="text-accent underline" href="https://www.impriindia.com/insights/policy-update/carbon-credit-trading-scheme-ccts-2/">IMPRI (28 Jul 2026)</a> and <a className="text-accent underline" href="https://reclimatize.in/india-ccc-carbon-credit-market-ccts-trading/">Reclimatize (7 Apr 2026)</a>: analyst price range ₹600–1,200 (unnamed analysts, not official).</li>
        </ul>
        <p className="mt-4"><Link href="/lab" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accentink">Open the Strategy Lab →</Link></p>
      </section>
    </main>
  );
}
