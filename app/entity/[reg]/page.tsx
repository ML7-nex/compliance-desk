import Link from "next/link";
import { notFound } from "next/navigation";
import { entities, STATE_NAMES, kt, pct, num, isUnreliable } from "@/lib/entities";

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
  const vals = [
    { label: "Baseline FY24", v: e.base, color: "#6b7280" },
    ...(e.t26 != null ? [{ label: "FY26 target", v: e.t26, color: "#2563eb" }] : []),
    { label: "FY27 target", v: e.t27, color: "#0f766e" },
  ];
  const max = Math.max(...vals.map((x) => x.v));
  const unitLabel = e.unit === "MBBLS" ? "MBBLS/NRGF" : "tonne of product";
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-blue-700 hover:underline dark:text-blue-400">← Atlas</Link>
      <h1 className="mt-3 text-2xl font-semibold">{e.name}</h1>
      <p className="mt-1 text-sm text-zinc-500">{e.reg} · {STATE_NAMES[e.state] ?? e.state} · {e.sector} / {e.sub}</p>
      {e.flag && <p role="note" className="mt-3 rounded bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">Data note: {e.flag}</p>}
      {e.t26 == null && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">No FY2025-26 target is listed for this entity in the gazette.</p>}
      <dl className="mt-6 grid grid-cols-2 gap-4 tabular-nums sm:grid-cols-4">
        <div><dt className="text-sm text-zinc-500">Baseline output</dt><dd className="text-lg font-semibold">{e.output.toLocaleString("en-IN")} {e.unit === "MBBLS" ? "MBBLS" : "t"}</dd></div>
        <div><dt className="text-sm text-zinc-500">Baseline emissions</dt><dd className="text-lg font-semibold">{bad ? "—" : kt(e.baseEmissions)}</dd></div>
        <div><dt className="text-sm text-zinc-500">Cut to FY27</dt><dd className="text-lg font-semibold">{bad ? "—" : pct(e.cutPct27)}</dd></div>
        <div><dt className="text-sm text-zinc-500">Tonnes to cut by FY27</dt><dd className="text-lg font-semibold">{bad ? "—" : kt(e.cut27)}</dd></div>
      </dl>
      <h2 className="mt-8 text-lg font-semibold">Intensity path (tCO₂e per {unitLabel})</h2>
      <svg role="img" aria-label="Baseline and target intensities" viewBox="0 0 440 120" className="mt-2 w-full max-w-xl">
        {vals.map((x, i) => (
          <g key={x.label} transform={`translate(0 ${i * 38 + 4})`}>
            <rect width={(x.v / max) * 240} height="26" rx="3" fill={x.color} />
            <text x={(x.v / max) * 240 + 8} y="18" fontSize="12" fill="currentColor">{x.label}: {num(x.v)}</text>
          </g>
        ))}
      </svg>
      <table className="mt-4 w-full max-w-xl text-sm tabular-nums">
        <caption className="sr-only">Intensity data</caption>
        <tbody>
          <tr><th scope="row" className="py-1 text-left font-normal">Baseline 2023-24</th><td className="text-right">{num(e.base)}</td></tr>
          <tr><th scope="row" className="py-1 text-left font-normal">Target 2025-26</th><td className="text-right">{e.t26 == null ? "—" : num(e.t26)}</td></tr>
          <tr><th scope="row" className="py-1 text-left font-normal">Target 2026-27</th><td className="text-right">{num(e.t27)}</td></tr>
        </tbody>
      </table>
      {e.sector === "Cement" && !bad && <p className="mt-6"><Link href={`/lab/${e.reg}`} className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">Open in Strategy Lab →</Link></p>}
      {!bad && <p className="mt-6 text-sm">Among {peers.length} {e.sub.toLowerCase()} plants in {e.sector.toLowerCase()}, this plant&apos;s required cut ranks <strong>#{rank}</strong> (1 = steepest).</p>}
      <p className="mt-8 text-xs text-zinc-500">Source: {e.source}. Emissions are derived: intensity × output{e.nrgf ? " × NRGF" : ""}. Not advice.</p>
    </main>
  );
}
