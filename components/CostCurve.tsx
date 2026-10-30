import type { Scenario } from "@/lib/engine/types";

/**
 * Abatement cost curve: each lever is a block. Width = tonnes delivered in FY27 (planned × expected delivery),
 * height = ₹ per tonne. Levers below the price line are cheaper than buying credits.
 */
export default function CostCurve({ s, shortfall27 }: { s: Scenario; shortfall27: number }) {
  const items = s.levers
    .map((l) => ({ l, t: l.potential * l.ramp[1] * l.deliveryMean }))
    .filter((x) => x.t > 0)
    .sort((a, b) => a.l.costPerTonne - b.l.costPerTonne);
  const price = s.market.meanPrice[1];
  const cap = price * s.rules.penaltyMultiple;
  const total = items.reduce((a, x) => a + x.t, 0);
  const W = 680, H = 230, L = 46, B = 28, T = 10;
  const xmax = Math.max(total, shortfall27, 1) * 1.05;
  const ymax = Math.max(cap, ...items.map((x) => x.l.costPerTonne), 1) * 1.1;
  const sx = (v: number) => L + (v / xmax) * (W - L - 8);
  const sy = (v: number) => H - B - (v / ymax) * (H - B - T);
  const starts = items.map((_, i) => items.slice(0, i).reduce((a, x) => a + x.t, 0));
  const palette = ["#56B4E9", "#E69F00", "#009E73", "#CC79A7", "#F0E442", "#D55E00", "#9aa7ff", "#8b98aa"];
  return (
    <section className="card mt-4 p-5">
      <div className="eyebrow">Abatement cost curve</div>
      <h2 className="mt-1 text-lg font-semibold">Which levers are cheaper than buying credits?</h2>
      {items.length === 0 ? <p className="mt-2 text-sm text-muted">Add a lever above to see how it compares with the credit price.</p> : (
        <>
          <svg role="img" aria-label="Abatement cost curve" viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full">
            {items.map((x, i) => {
              const x0 = sx(starts[i]), x1 = sx(starts[i] + x.t);
              return (
                <g key={x.l.id}>
                  <rect x={x0} y={sy(x.l.costPerTonne)} width={Math.max(1, x1 - x0 - 1)} height={H - B - sy(x.l.costPerTonne)} fill={palette[i % palette.length]} opacity="0.85" />
                  {x1 - x0 > 38 && <text x={(x0 + x1) / 2} y={sy(x.l.costPerTonne) - 4} fontSize="10" textAnchor="middle" fill="var(--muted)">₹{Math.round(x.l.costPerTonne)}</text>}
                </g>
              );
            })}
            <line x1={L} x2={W - 8} y1={sy(price)} y2={sy(price)} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x={W - 10} y={sy(price) - 5} fontSize="10" textAnchor="end" fill="var(--accent)">expected CCC price ₹{Math.round(price)}</text>
            <line x1={L} x2={W - 8} y1={sy(cap)} y2={sy(cap)} stroke="var(--danger)" strokeWidth="1" strokeDasharray="2 4" />
            <text x={L + 6} y={sy(cap) - 5} fontSize="10" textAnchor="start" fill="var(--danger)">penalty line ₹{Math.round(cap)} ({s.rules.penaltyMultiple}×)</text>
            {shortfall27 > 0 && <><line x1={sx(shortfall27)} x2={sx(shortfall27)} y1={T} y2={H - B} stroke="var(--text)" strokeWidth="1" strokeDasharray="1 3" />
              <text x={sx(shortfall27)} y={H - 8} fontSize="10" textAnchor="middle" fill="var(--text)">FY27 shortfall {(shortfall27 / 1000).toLocaleString("en-IN", { maximumFractionDigits: shortfall27 < 1e4 ? 1 : 0 })} kt</text></>}
            <line x1={L} x2={W - 8} y1={H - B} y2={H - B} stroke="var(--border)" />
            <text x={L} y={H - 8} fontSize="10" fill="var(--muted)">0 → kt abated in FY27 (axis to {(xmax / 1000).toLocaleString("en-IN", { maximumFractionDigits: xmax < 1e4 ? 1 : 0 })} kt)</text>
            <text x={4} y={T + 8} fontSize="10" fill="var(--muted)">₹/t</text>
          </svg>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {items.map((x, i) => <li key={x.l.id} className="flex items-center gap-1.5"><i className="inline-block h-2 w-3 rounded-sm" style={{ background: palette[i % palette.length] }} />{x.l.name} · {(x.t / 1000).toFixed(1)} kt · ₹{Math.round(x.l.costPerTonne)}/t {x.l.costPerTonne < price ? "· below price" : "· above price"}</li>)}
          </ul>
        </>
      )}
    </section>
  );
}
