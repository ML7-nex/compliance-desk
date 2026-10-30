import { kt, pct } from "@/lib/entities";
import { sectorColor } from "@/lib/theme";

type T = { sector: string; n: number; baseEmissions: number; cut27: number };

/** Required cut by sector (kt) with the cut as a share of baseline. Bars share one scale. */
export default function SectorBars({ totals }: { totals: T[] }) {
  const rows = [...totals].sort((a, b) => b.cut27 - a.cut27);
  const max = Math.max(...rows.map((r) => r.cut27));
  return (
    <div className="card p-5">
      <div className="eyebrow">Where the tonnes are</div>
      <h2 className="mt-1 text-lg font-semibold">Required cut by FY27, by sector</h2>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.sector}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: sectorColor(r.sector) }} />{r.sector} <span className="text-muted">· {r.n}</span></span>
              <span className="num text-muted"><span className="text-ink">{kt(r.cut27)}</span> · {pct(r.cut27 / r.baseEmissions)} of baseline</span>
            </div>
            <div className="h-2 rounded-full bg-surface2">
              <div className="h-2 rounded-full" style={{ width: `${(r.cut27 / max) * 100}%`, background: sectorColor(r.sector) }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
