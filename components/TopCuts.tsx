import Link from "next/link";
import { entities, isUnreliable, kt, pct } from "@/lib/entities";
import { sectorColor } from "@/lib/theme";

/** The ten plants with the most tonnes to cut by FY27. */
export default function TopCuts() {
  const top = entities.filter((e) => !isUnreliable(e)).sort((a, b) => b.cut27 - a.cut27).slice(0, 8);
  const max = top[0].cut27;
  return (
    <div className="card p-5">
      <div className="eyebrow">Steepest absolute cuts</div>
      <h2 className="mt-1 text-lg font-semibold">Biggest plants to watch</h2>
      <ol className="mt-4 space-y-2.5">
        {top.map((e, i) => (
          <li key={e.reg}>
            <Link href={`/entity/${e.reg}`} className="group block">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate group-hover:text-accent"><span className="num mr-2 text-muted">{i + 1}</span>{e.name.split(",").slice(0, 2).join(",")} <span className="num text-xs text-muted">{e.reg}</span></span>
                <span className="num shrink-0 text-muted"><span className="text-ink">{kt(e.cut27)}</span> · {pct(e.cutPct27)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-surface2"><div className="h-1.5 rounded-full" style={{ width: `${(e.cut27 / max) * 100}%`, background: sectorColor(e.sector) }} /></div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
