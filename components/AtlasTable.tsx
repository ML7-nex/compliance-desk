"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { EntityRow } from "@/lib/entities";
import { STATE_NAMES, kt, pct, num } from "@/lib/entities";
import { sectorColor } from "@/lib/theme";

type SortKey = "name" | "base" | "cut27" | "cutPct27";

export default function AtlasTable({ rows, sectors }: { rows: EntityRow[]; sectors: string[] }) {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("");
  const [state, setState] = useState("");
  const [sort, setSort] = useState<SortKey>("cut27");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [limit, setLimit] = useState(50);

  const states = useMemo(() => Array.from(new Set(rows.map((r) => r.state))).sort(), [rows]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows
      .filter((r) => (!sector || r.sector === sector) && (!state || r.state === state))
      .filter((r) => !s || r.name.toLowerCase().includes(s) || r.reg.toLowerCase().includes(s))
      .sort((a, b) => {
        const av = sort === "name" ? a.name : a[sort];
        const bv = sort === "name" ? b.name : b[sort];
        return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
      });
  }, [rows, q, sector, state, sort, dir]);

  const maxCut = useMemo(() => Math.max(...filtered.filter((r) => r.reg !== "TXTOE127MH").map((r) => r.cut27), 1), [filtered]);
  const maxPct = useMemo(() => Math.max(...filtered.filter((r) => r.reg !== "TXTOE127MH").map((r) => r.cutPct27), 0.01), [filtered]);

  const head = (k: SortKey, label: string, right = true) => (
    <th scope="col" className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted ${right ? "text-right" : "text-left"}`} aria-sort={sort === k ? (dir === 1 ? "ascending" : "descending") : "none"}>
      <button onClick={() => (sort === k ? setDir((d) => (d === 1 ? -1 : 1)) : (setSort(k), setDir(-1)))} className="uppercase tracking-wider hover:text-ink">
        {label}<span className="ml-1 text-accent">{sort === k ? (dir === 1 ? "▲" : "▼") : ""}</span>
      </button>
    </th>
  );

  const field = "rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted";
  const chip = (active: boolean) => `rounded-full border px-3 py-1 text-xs font-medium transition ${active ? "border-accent bg-accent text-accentink" : "border-line text-muted hover:text-ink"}`;
  const reset = () => setLimit(50);

  return (
    <div>
      {sectors.length > 1 && <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by sector">
        <button className={chip(sector === "")} onClick={() => { setSector(""); reset(); }}>All</button>
        {sectors.map((s) => (
          <button key={s} className={chip(sector === s)} aria-pressed={sector === s} onClick={() => { setSector(sector === s ? "" : s); reset(); }}>
            <i className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: sectorColor(s) }} />{s}
          </button>
        ))}
      </div>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input aria-label="Search entities" placeholder="Search name or registration no." value={q} onChange={(e) => { setQ(e.target.value); reset(); }} className={`min-w-64 flex-1 ${field}`} />
        <select aria-label="State" value={state} onChange={(e) => { setState(e.target.value); reset(); }} className={field}>
          <option value="">All states</option>
          {states.map((s) => <option key={s} value={s}>{STATE_NAMES[s] ?? s}</option>)}
        </select>
        <span className="num text-sm text-muted">{filtered.length} of {rows.length}</span>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="num w-full text-sm">
          <thead className="sticky top-0 border-b border-line bg-surface2">
            <tr>
              {head("name", "Entity", false)}
              {head("base", "Baseline")}
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">FY26</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted">FY27</th>
              {head("cutPct27", "Cut")}
              {head("cut27", "Tonnes to cut")}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map((r) => {
              const bad = r.reg === "TXTOE127MH";
              return (
                <tr key={r.reg} className="border-t border-line transition hover:bg-surface2">
                  <td className="max-w-sm px-4 py-3">
                    <Link href={`/entity/${r.reg}`} className="font-medium hover:text-accent">{r.name.split(",").slice(0, 2).join(",")}</Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <i className="inline-block h-2 w-2 rounded-full" style={{ background: sectorColor(r.sector) }} />
                      {r.sector} · {r.sub} · {STATE_NAMES[r.state] ?? r.state}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-muted">{num(r.base)}</td>
                  <td className="px-4 py-3 text-right text-muted">{r.t26 == null ? "—" : num(r.t26)}</td>
                  <td className="px-4 py-3 text-right">{num(r.t27)}</td>
                  <td className="px-4 py-3 text-right">
                    {bad ? "—" : (
                      <div className="ml-auto flex w-24 items-center justify-end gap-2">
                        <span>{pct(r.cutPct27)}</span>
                        <span className="h-1.5 w-8 rounded-full bg-surface2"><span className="block h-1.5 rounded-full bg-blue" style={{ width: `${(r.cutPct27 / maxPct) * 100}%` }} /></span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {bad ? "—" : (
                      <div className="ml-auto flex w-36 items-center justify-end gap-2">
                        <span>{kt(r.cut27)}</span>
                        <span className="h-1.5 w-12 rounded-full bg-surface2"><span className="block h-1.5 rounded-full bg-accent" style={{ width: `${(r.cut27 / maxCut) * 100}%` }} /></span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No entities match.</td></tr>}
          </tbody>
        </table>
      </div>
      {filtered.length > limit && (
        <button onClick={() => setLimit((l) => l + 100)} className="mt-4 w-full rounded-lg border border-line py-2.5 text-sm font-medium text-muted hover:text-ink">
          Show more ({filtered.length - limit} left)
        </button>
      )}
    </div>
  );
}
