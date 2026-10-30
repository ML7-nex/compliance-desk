import AtlasTable from "@/components/AtlasTable";
import { entities, SECTORS, sectorTotals, kt, pct } from "@/lib/entities";

export default function Home() {
  const totals = sectorTotals();
  const all = totals.reduce((a, t) => ({ b: a.b + t.baseEmissions, c: a.c + t.cut27 }), { b: 0, c: 0 });
  const tile = "rounded border border-zinc-200 p-4 dark:border-zinc-800";
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold">CCTS Atlas</h1>
      <p className="mt-2 max-w-3xl text-zinc-600 dark:text-zinc-400">
        Every obligated entity with a notified emission-intensity target under India&apos;s Carbon Credit Trading Scheme: baseline, FY2025-26 and FY2026-27 targets, and the implied tonnes to cut.
      </p>
      <section aria-label="Summary" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={tile}><div className="text-sm text-zinc-500">Obligated entities</div><div className="text-2xl font-semibold tabular-nums">{entities.length}</div></div>
        <div className={tile}><div className="text-sm text-zinc-500">Baseline emissions (FY24)</div><div className="text-2xl font-semibold tabular-nums">{(all.b / 1e6).toFixed(0)} Mt</div></div>
        <div className={tile}><div className="text-sm text-zinc-500">Implied cut by FY27</div><div className="text-2xl font-semibold tabular-nums">{(all.c / 1e6).toFixed(1)} Mt <span className="text-base font-normal text-zinc-500">({pct(all.c / all.b)})</span></div></div>
        <div className={tile}><div className="text-sm text-zinc-500">Sectors</div><div className="text-2xl font-semibold tabular-nums">{SECTORS.length}</div></div>
      </section>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium">Sector table</summary>
        <table className="mt-2 w-full max-w-2xl text-sm tabular-nums">
          <thead><tr className="text-left"><th className="py-1">Sector</th><th className="text-right">Entities</th><th className="text-right">Baseline emissions</th><th className="text-right">Cut to FY27</th></tr></thead>
          <tbody>
            {totals.map((t) => (
              <tr key={t.sector} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-1">{t.sector}</td><td className="text-right">{t.n}</td><td className="text-right">{kt(t.baseEmissions)}</td>
                <td className="text-right">{kt(t.cut27)} ({pct(t.cut27 / t.baseEmissions)})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <div className="mt-6"><AtlasTable rows={entities} sectors={SECTORS} /></div>
      <footer className="mt-10 text-xs text-zinc-500">
        Source: MoEFCC gazette G.S.R. 739(E), 8 Oct 2025 and G.S.R. 25(E), 13 Jan 2026. Tonnes to cut = (baseline − FY27 target intensity) × baseline output (× NRGF for refineries). Iron &amp; steel not yet notified. Not advice.
      </footer>
    </main>
  );
}
