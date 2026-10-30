import Link from "next/link";
import AtlasTable from "@/components/AtlasTable";
import SectorBars from "@/components/SectorBars";
import TopCuts from "@/components/TopCuts";
import { entities, SECTORS, sectorTotals, pct } from "@/lib/entities";

export default function Home() {
  const totals = sectorTotals();
  const all = totals.reduce((a, t) => ({ b: a.b + t.baseEmissions, c: a.c + t.cut27 }), { b: 0, c: 0 });
  const kpis = [
    { k: "Obligated entities", v: entities.length.toString(), s: `${SECTORS.length} sectors notified` },
    { k: "Baseline emissions", v: `${(all.b / 1e6).toFixed(0)} Mt`, s: "FY2023-24, tCO₂e" },
    { k: "Implied cut by FY27", v: `${(all.c / 1e6).toFixed(1)} Mt`, s: `${pct(all.c / all.b)} of baseline` },
  ];
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-14 sm:pt-20">
          <p className="eyebrow rise text-accent">India · Carbon Credit Trading Scheme</p>
          <h1 className="rise mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl" style={{ animationDelay: "60ms" }}>
            Every legally binding carbon target in India, <span className="text-accent">in one place.</span>
          </h1>
          <p className="rise mt-5 max-w-2xl text-lg text-muted" style={{ animationDelay: "120ms" }}>
            Search {entities.length} obligated plants, see how hard each target bites, then model what it costs to comply.
          </p>
          <div className="rise mt-7 flex flex-wrap gap-3" style={{ animationDelay: "150ms" }}>
            <a href="#atlas" className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accentink transition hover:brightness-110">Browse the atlas</a>
            <Link href="/lab" className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold transition hover:border-accent hover:text-accent">Open Strategy Lab →</Link>
          </div>
          <dl className="rise mt-9 grid gap-3 sm:grid-cols-3" style={{ animationDelay: "180ms" }}>
            {kpis.map((x) => (
              <div key={x.k} className="card p-5">
                <dt className="eyebrow">{x.k}</dt>
                <dd className="num mt-2 text-4xl font-semibold tracking-tight">{x.v}</dd>
                <dd className="mt-1 text-sm text-muted">{x.s}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 lg:grid-cols-2">
          <SectorBars totals={totals} />
          <TopCuts />
        </div>

        <h2 id="atlas" className="mt-14 scroll-mt-20 text-2xl font-semibold tracking-tight">Browse the atlas</h2>
        <p className="mt-1 text-muted">Filter by sector or state. Click a plant for its targets, peers and Strategy Lab.</p>
        <div className="mt-5"><AtlasTable rows={entities} sectors={SECTORS} /></div>

        <section id="method" className="card mt-14 p-6 text-sm text-muted">
          <div className="eyebrow">Method &amp; sources</div>
          <p className="mt-2 max-w-3xl">
            Targets come from MoEFCC gazette G.S.R. 739(E) (8 Oct 2025) and G.S.R. 25(E) (13 Jan 2026). Tonnes to cut = (baseline − FY27 target intensity) × baseline output, times NRGF for refineries.
            Iron &amp; steel is not yet notified. Plant names from the October notification are under verification against the PDF. Illustrative analysis, not advice.
          </p>
        </section>
      </div>
    </>
  );
}
