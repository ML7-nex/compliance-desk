import type { Draws } from "@/lib/engine/simulate";

const q = (a: Float64Array, p: number) => {
  const s = Float64Array.from(a).sort();
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

/** Simulated CCC price range per compliance year: P5–P95 band, P25–P75 box, median tick. */
export default function PriceBands({ d, meanPrice }: { d: Draws; meanPrice: [number, number] }) {
  const years = [{ name: "FY26", a: d.price[0] }, { name: "FY27", a: d.price[1] }].map((y, i) => ({
    name: y.name, p5: q(y.a, 0.05), p25: q(y.a, 0.25), p50: q(y.a, 0.5), p75: q(y.a, 0.75), p95: q(y.a, 0.95), mean: meanPrice[i],
  }));
  const W = 680, H = 150, L = 50, R = 20;
  const ymax = Math.max(...years.map((y) => y.p95)) * 1.08;
  const sx = (v: number) => L + (v / ymax) * (W - L - R);
  return (
    <section className="card mt-4 p-5">
      <div className="eyebrow">Price scenarios</div>
      <h2 className="mt-1 text-lg font-semibold">How wide is the range of credit prices?</h2>
      <svg role="img" aria-label="Simulated CCC price ranges by year" viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full">
        {years.map((y, i) => {
          const cy = 28 + i * 52;
          return (
            <g key={y.name}>
              <text x="0" y={cy + 4} fontSize="12" fill="var(--muted)">{y.name}</text>
              <line x1={sx(y.p5)} x2={sx(y.p95)} y1={cy} y2={cy} stroke="var(--blue)" strokeWidth="2" />
              <rect x={sx(y.p25)} y={cy - 9} width={sx(y.p75) - sx(y.p25)} height="18" rx="4" fill="var(--blue)" opacity="0.45" />
              <line x1={sx(y.p50)} x2={sx(y.p50)} y1={cy - 11} y2={cy + 11} stroke="var(--text)" strokeWidth="2" />
              <text x={sx(y.p5)} y={cy + 26} fontSize="10" textAnchor="middle" fill="var(--muted)">P5 ₹{Math.round(y.p5)}</text>
              <text x={sx(y.p50)} y={cy - 14} fontSize="10" textAnchor="middle" fill="var(--text)">median ₹{Math.round(y.p50)}</text>
              <text x={sx(y.p95)} y={cy + 26} fontSize="10" textAnchor="middle" fill="var(--muted)">P95 ₹{Math.round(y.p95)}</text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-xs text-muted">Thin line: 5th to 95th percentile. Box: middle half of outcomes. Scenario only; no CCC has traded yet.</p>
    </section>
  );
}
