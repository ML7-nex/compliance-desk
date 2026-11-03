import type { PlantInputs } from "@/lib/simple";

/**
 * Each abatement is a block. Width = thousand tonnes it can cut, height = rupees per tonne.
 * Blocks below the green line cost less than a credit, so they are worth doing before buying credits.
 */
export default function SimpleCostCurve({ inputs, gapT, price }: { inputs: PlantInputs; gapT: number; price: number }) {
  const items = inputs.abatements.filter((a) => a.enabled && a.potentialKt > 0).sort((a, b) => a.costPerTonne - b.costPerTonne);
  const total = items.reduce((t, a) => t + a.potentialKt * 1000, 0);
  const W = 680, H = 230, L = 46, B = 28, T = 12;
  const xmax = Math.max(total, gapT, 1) * 1.05;
  const ymax = Math.max(price, ...items.map((a) => a.costPerTonne), 1) * 1.15;
  const sx = (v: number) => L + (v / xmax) * (W - L - 8);
  const sy = (v: number) => H - B - (v / ymax) * (H - B - T);
  const starts = items.map((_, i) => items.slice(0, i).reduce((t, a) => t + a.potentialKt * 1000, 0));
  const palette = ["#56B4E9", "#E69F00", "#009E73", "#CC79A7", "#F0E442", "#D55E00", "#9aa7ff", "#8b98aa"];
  const k = (t: number) => (t / 1000).toLocaleString("en-IN", { maximumFractionDigits: t < 1e4 ? 1 : 0 });
  return (
    <section className="p-5">
      <h2 className="text-lg font-semibold">Which abatements are worth doing?</h2>
      <p className="mt-1 text-sm text-muted">An abatement is worth doing when it costs less per tonne than a credit. Blocks below the green line are cheaper than buying credits.</p>
      {items.length === 0 ? <p className="mt-3 text-sm text-muted">No abatements switched on.</p> : (
        <>
          <svg role="img" aria-label="Cost per tonne of each abatement against the credit price" viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full">
            {items.map((a, i) => {
              const x0 = sx(starts[i]), x1 = sx(starts[i] + a.potentialKt * 1000);
              return (
                <g key={a.id}>
                  <rect x={x0} y={sy(a.costPerTonne)} width={Math.max(1, x1 - x0 - 1)} height={H - B - sy(a.costPerTonne)} fill={palette[i % palette.length]} opacity="0.85" />
                  {x1 - x0 > 40 && <text x={(x0 + x1) / 2} y={sy(a.costPerTonne) - 4} fontSize="10" textAnchor="middle" fill="var(--muted)">₹{Math.round(a.costPerTonne)}</text>}
                </g>
              );
            })}
            <line x1={L} x2={W - 8} y1={sy(price)} y2={sy(price)} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x={W - 10} y={sy(price) - 5} fontSize="10" textAnchor="end" fill="var(--accent)">credit price ₹{Math.round(price)}</text>
            {gapT > 0 && <><line x1={sx(gapT)} x2={sx(gapT)} y1={T} y2={H - B} stroke="var(--text)" strokeWidth="1" strokeDasharray="1 3" />
              <text x={sx(gapT)} y={H - 8} fontSize="10" textAnchor="middle" fill="var(--text)">the gap: {k(gapT)} kt</text></>}
            <line x1={L} x2={W - 8} y1={H - B} y2={H - B} stroke="var(--border)" />
            <text x={L} y={H - 8} fontSize="10" fill="var(--muted)">0</text>
            <text x={4} y={T + 8} fontSize="10" fill="var(--muted)">₹/t</text>
          </svg>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {items.map((a, i) => <li key={a.id} className="flex items-center gap-1.5"><i className="inline-block h-2 w-3 rounded-sm" style={{ background: palette[i % palette.length] }} />{a.name} · {k(a.potentialKt * 1000)} kt · ₹{Math.round(a.costPerTonne)}/t {a.costPerTonne < price ? "· cheaper than a credit" : "· dearer than a credit"}</li>)}
          </ul>
        </>
      )}
    </section>
  );
}
