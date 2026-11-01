import { entities, kt, pct, STATE_NAMES } from "@/lib/entities";

/** Required cut by FY27 for cement plants, grouped by state (state comes from the registration number). */
export default function StateBars() {
  const by = new Map<string, { n: number; cut: number; base: number }>();
  for (const e of entities) {
    const r = by.get(e.state) ?? { n: 0, cut: 0, base: 0 };
    r.n += 1; r.cut += e.cut27; r.base += e.baseEmissions;
    by.set(e.state, r);
  }
  const rows = [...by.entries()].map(([s, r]) => ({ s, ...r })).sort((a, b) => b.cut - a.cut).slice(0, 8);
  const max = rows[0]?.cut ?? 1;
  return (
    <div className="card p-5">
      <div className="eyebrow">Where the tonnes are</div>
      <h2 className="mt-1 text-lg font-semibold">Required cut by FY27, top states</h2>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.s}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span>{STATE_NAMES[r.s] ?? r.s} <span className="text-muted">· {r.n} plants</span></span>
              <span className="num text-muted"><span className="text-ink">{kt(r.cut)}</span> · {pct(r.cut / r.base)} of baseline</span>
            </div>
            <div className="h-2 rounded-full bg-surface2"><div className="h-2 rounded-full bg-accent" style={{ width: `${(r.cut / max) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
