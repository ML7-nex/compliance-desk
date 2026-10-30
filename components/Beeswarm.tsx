import type { EntityRow } from "@/lib/entities";
import { pct } from "@/lib/entities";

/**
 * Peer beeswarm: every plant in the sub-sector placed by required cut (% of baseline intensity by FY27).
 * Dots are packed so none overlap; the selected plant is highlighted.
 */
export default function Beeswarm({ peers, selected, color }: { peers: EntityRow[]; selected: string; color: string }) {
  const W = 680, H = 130, padX = 24, r = 4.2, axisY = H - 34;
  const xs = peers.map((p) => p.cutPct27);
  const lo = Math.min(...xs), hi = Math.max(...xs);
  const sx = (v: number) => padX + ((v - lo) / (hi - lo || 1)) * (W - 2 * padX);
  const placed: { x: number; y: number; p: EntityRow }[] = [];
  for (const p of [...peers].sort((a, b) => a.cutPct27 - b.cutPct27)) {
    const x = sx(p.cutPct27);
    let off = 0;
    for (let k = 0; k < 400; k++) {
      const cand = k === 0 ? 0 : Math.ceil(k / 2) * (r * 2 - 0.4) * (k % 2 ? 1 : -1);
      if (placed.every((q) => (q.x - x) ** 2 + (q.y - (axisY - 14 + cand)) ** 2 >= (2 * r) ** 2)) { off = cand; break; }
    }
    placed.push({ x, y: axisY - 14 + Math.min(0, -Math.abs(off)), p });
  }
  const sel = placed.find((d) => d.p.reg === selected);
  const median = [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  return (
    <figure>
      <svg role="img" aria-label={`Beeswarm of required cut across ${peers.length} peer plants`} viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={padX} x2={W - padX} y1={axisY} y2={axisY} stroke="var(--border)" />
        <line x1={sx(median)} x2={sx(median)} y1={22} y2={axisY} stroke="var(--muted)" strokeDasharray="3 4" />
        <text x={sx(median)} y={14} fontSize="10" textAnchor="middle" fill="var(--muted)">median {pct(median)}</text>
        {placed.map((d) => d.p.reg !== selected && <circle key={d.p.reg} cx={d.x} cy={d.y} r={r} fill={color} opacity="0.55" />)}
        {sel && (<>
          <circle cx={sel.x} cy={sel.y} r={r + 5} fill="none" stroke="var(--accent)" strokeWidth="2" />
          <circle cx={sel.x} cy={sel.y} r={r + 1} fill="var(--accent)" />
        </>)}
        <text x={padX} y={H - 12} fontSize="11" fill="var(--muted)">{pct(lo)}</text>
        <text x={W - padX} y={H - 12} fontSize="11" textAnchor="end" fill="var(--muted)">{pct(hi)}</text>
        <text x={W / 2} y={H - 12} fontSize="11" textAnchor="middle" fill="var(--muted)">required cut by FY27 →</text>
      </svg>
    </figure>
  );
}
