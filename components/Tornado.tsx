import type { Bar } from "@/lib/sensitivity";
import { money } from "@/lib/format";

const cr = money;

/** Which assumption moves expected cost most? Bars are centred on the current expected cost of the optimised plan. */
export default function Tornado({ base, bars }: { base: number; bars: Bar[] }) {
  const W = 680, L = 150, R = 20, row = 34;
  const H = bars.length * row + 34;
  const span = Math.max(...bars.map((b) => Math.max(Math.abs(b.low - base), Math.abs(b.high - base))), 1);
  const cx = L + (W - L - R) / 2;
  const sx = (v: number) => cx + ((v - base) / span) * ((W - L - R) / 2 - 34);
  const top = bars[0];
  return (
    <section className="card mt-4 p-5">
      <div className="eyebrow">Sensitivity</div>
      <h2 className="mt-1 text-lg font-semibold">Which assumption moves your answer most?</h2>
      <p className="mt-1 text-sm text-muted">
        {top && <>The biggest swing is <strong className="text-ink">{top.label.toLowerCase()}</strong>: expected cost moves from {cr(top.low)} to {cr(top.high)} around {cr(base)}.</>}
      </p>
      <svg role="img" aria-label="Sensitivity tornado of expected cost" viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full">
        <line x1={cx} x2={cx} y1={4} y2={H - 20} stroke="var(--muted)" strokeDasharray="3 3" />
        {bars.map((b, i) => {
          const y = 8 + i * row;
          const lo = Math.min(b.low, b.high), hi = Math.max(b.low, b.high);
          return (
            <g key={b.label}>
              <text x="0" y={y + 17} fontSize="12" fill="var(--text)">{b.label}</text>
              <rect x={sx(Math.min(lo, base))} y={y + 3} width={Math.abs(sx(base) - sx(lo))} height="18" fill="var(--accent)" opacity="0.8" rx="3" />
              <rect x={sx(base)} y={y + 3} width={Math.abs(sx(hi) - sx(base))} height="18" fill="var(--warn)" opacity="0.8" rx="3" />
              <text x={sx(lo) - 4} y={y + 16} fontSize="10" textAnchor="end" fill="var(--muted)">{b.low <= b.high ? b.lowNote : b.highNote}</text>
              <text x={sx(hi) + 4} y={y + 16} fontSize="10" fill="var(--muted)">{b.low <= b.high ? b.highNote : b.lowNote}</text>
            </g>
          );
        })}
        <text x={cx} y={H - 4} fontSize="10" textAnchor="middle" fill="var(--muted)">expected cost {cr(base)}</text>
      </svg>
      <p className="mt-1 text-xs text-muted">Each bar changes one assumption and holds the optimised plan fixed. Green = cheaper, amber = costlier.</p>
    </section>
  );
}
