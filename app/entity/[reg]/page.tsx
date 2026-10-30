import Link from "next/link";
import { notFound } from "next/navigation";
import Beeswarm from "@/components/Beeswarm";
import { entities, STATE_NAMES, kt, pct, num, isUnreliable } from "@/lib/entities";
import { sectorColor } from "@/lib/theme";

export function generateStaticParams() {
  return entities.map((e) => ({ reg: e.reg }));
}

export default async function EntityPage({ params }: { params: Promise<{ reg: string }> }) {
  const { reg } = await params;
  const e = entities.find((x) => x.reg === reg);
  if (!e) notFound();
  const peers = entities.filter((x) => x.sector === e.sector && x.sub === e.sub && !isUnreliable(x));
  const rank = peers.filter((p) => p.cutPct27 > e.cutPct27).length + 1;
  const bad = isUnreliable(e);
  const col = sectorColor(e.sector);
  const note = e.flag.split("; ").filter((f) => f !== "sub_sector unverified").join("; ");
  const parts = e.name.split(",");
  const title = parts.slice(0, 2).join(",");
  const address = parts.slice(2).join(",").trim();
  const unitLabel = e.unit === "MBBLS" ? "tCO₂e / MBBLS / NRGF" : "tCO₂e / tonne of product";
  const steps = [
    { label: "Baseline FY24", v: e.base, color: "var(--muted)" },
    ...(e.t26 != null ? [{ label: "Target FY26", v: e.t26, color: "var(--blue)" }] : []),
    { label: "Target FY27", v: e.t27, color: "var(--accent)" },
  ];
  const max = Math.max(...steps.map((s) => s.v));
  const min = Math.min(...steps.map((s) => s.v));
  const lo = min - (max - min) * 1.2 - 1e-9; // truncated axis, labelled, so small cuts are visible
  const kpis = [
    { k: "Cut required by FY27", v: bad ? "—" : pct(e.cutPct27), s: "vs baseline intensity" },
    { k: "Tonnes to cut", v: bad ? "—" : kt(e.cut27), s: "tCO₂e per year by FY27" },
    { k: "Baseline emissions", v: bad ? "—" : kt(e.baseEmissions), s: "FY2023-24" },
    { k: "Baseline output", v: `${(e.output / 1000).toLocaleString("en-IN", { maximumFractionDigits: 0 })} k${e.unit === "MBBLS" ? "bbl" : "t"}`, s: e.unit === "MBBLS" ? "crude throughput (MBBLS)" : "equivalent product" },
  ];
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="text-sm text-muted hover:text-accent">← Atlas</Link>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1"><i className="h-2 w-2 rounded-full" style={{ background: col }} />{e.sector}</span>
        <span className="rounded-full border border-line px-2.5 py-1 text-muted">{e.sub}</span>
        <span className="num rounded-full border border-line px-2.5 py-1 text-muted">{e.reg}</span>
        <span className="rounded-full border border-line px-2.5 py-1 text-muted">{STATE_NAMES[e.state] ?? e.state}</span>
      </div>
      <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
      {address && <p className="mt-1 text-sm text-muted">{address}</p>}
      {note && <p role="note" className="mt-4 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">Data note: {note}</p>}
      {e.t26 == null && <p className="mt-3 text-sm text-muted">No FY2025-26 target is listed for this entity in the gazette.</p>}

      <dl className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((x) => (
          <div key={x.k} className="card p-4">
            <dt className="eyebrow">{x.k}</dt>
            <dd className="num mt-2 text-2xl font-semibold tracking-tight">{x.v}</dd>
            <dd className="mt-0.5 text-xs text-muted">{x.s}</dd>
          </div>
        ))}
      </dl>

      {e.sector === "Cement" && !bad && (
        <Link href={`/lab/${e.reg}`} className="group mt-5 flex items-center justify-between rounded-xl bg-accent p-5 text-accentink transition hover:brightness-110">
          <span><span className="block text-lg font-semibold">Model this plant in Strategy Lab</span><span className="text-sm opacity-80">How much to abate, buy and hedge, priced across thousands of scenarios</span></span>
          <span className="text-2xl transition group-hover:translate-x-1">→</span>
        </Link>
      )}

      <section className="card mt-5 p-5">
        <div className="eyebrow">Intensity path</div>
        <h2 className="mt-1 text-lg font-semibold">{unitLabel}</h2>
        <svg role="img" aria-label="Baseline and target intensities" viewBox={`0 0 640 ${steps.length * 46}`} className="mt-3 w-full" style={{ height: steps.length * 46 }}>
          {steps.map((s, i) => {
            const w = ((s.v - lo) / (max - lo)) * 440;
            return (
              <g key={s.label} transform={`translate(0 ${i * 46 + 4})`}>
                <text x="0" y="22" fontSize="12" fill="var(--muted)">{s.label}</text>
                <rect x="110" width={w} height="32" rx="6" fill={s.color} opacity={i === 0 ? 0.5 : 1} />
                <text x={110 + w + 10} y="22" fontSize="14" fontWeight="600" fill="var(--text)" className="num">{num(s.v)}</text>
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-xs text-muted">Bars start from a truncated axis so small differences are visible. Exact values are in the table below.</p>
        <table className="num mt-3 w-full max-w-md text-sm">
          <caption className="sr-only">Intensity data</caption>
          <tbody>
            <tr className="border-t border-line"><th scope="row" className="py-1.5 text-left font-normal text-muted">Baseline 2023-24</th><td className="text-right">{num(e.base)}</td></tr>
            <tr className="border-t border-line"><th scope="row" className="py-1.5 text-left font-normal text-muted">Target 2025-26</th><td className="text-right">{e.t26 == null ? "—" : num(e.t26)}</td></tr>
            <tr className="border-t border-line"><th scope="row" className="py-1.5 text-left font-normal text-muted">Target 2026-27</th><td className="text-right">{num(e.t27)}</td></tr>
          </tbody>
        </table>
      </section>

      {!bad && peers.length > 2 && (
        <section className="card mt-4 p-5">
          <div className="eyebrow">Peer comparison</div>
          <h2 className="mt-1 text-lg font-semibold">How hard is this target versus {peers.length - 1} peers?</h2>
          <p className="mt-1 text-sm text-muted">This plant ranks <strong className="text-ink">#{rank} of {peers.length}</strong> in {e.sector.toLowerCase()} / {e.sub.toLowerCase()} for required cut (1 = steepest).</p>
          <div className="mt-3"><Beeswarm peers={peers} selected={e.reg} color={col} /></div>
        </section>
      )}
      <p className="mt-6 text-xs text-muted">Source: {e.source}. Emissions are derived: intensity × output{e.nrgf ? " × NRGF" : ""}. Not advice.</p>
    </main>
  );
}
