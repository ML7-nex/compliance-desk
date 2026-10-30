"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { EntityRow } from "@/lib/entities";
import { STATE_NAMES, kt, pct, num } from "@/lib/entities";

type SortKey = "name" | "base" | "cut27" | "cutPct27";

export default function AtlasTable({ rows, sectors }: { rows: EntityRow[]; sectors: string[] }) {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("");
  const [state, setState] = useState("");
  const [sort, setSort] = useState<SortKey>("cut27");
  const [dir, setDir] = useState<1 | -1>(-1);

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

  const head = (k: SortKey, label: string, right = true) => (
    <th scope="col" className={`px-3 py-2 font-medium ${right ? "text-right" : "text-left"}`} aria-sort={sort === k ? (dir === 1 ? "ascending" : "descending") : "none"}>
      <button onClick={() => (sort === k ? setDir((d) => (d === 1 ? -1 : 1)) : (setSort(k), setDir(-1)))} className="hover:underline">
        {label}{sort === k ? (dir === 1 ? " ▲" : " ▼") : ""}
      </button>
    </th>
  );

  const field = "rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input aria-label="Search entities" placeholder="Search name or registration no." value={q} onChange={(e) => setQ(e.target.value)} className={`min-w-64 flex-1 ${field}`} />
        <select aria-label="Sector" value={sector} onChange={(e) => setSector(e.target.value)} className={field}>
          <option value="">All sectors</option>
          {sectors.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select aria-label="State" value={state} onChange={(e) => setState(e.target.value)} className={field}>
          <option value="">All states</option>
          {states.map((s) => <option key={s} value={s}>{STATE_NAMES[s] ?? s}</option>)}
        </select>
      </div>
      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">{filtered.length} of {rows.length} entities</p>
      <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm tabular-nums">
          <thead className="bg-zinc-100 dark:bg-zinc-900">
            <tr>
              {head("name", "Entity", false)}
              <th scope="col" className="px-3 py-2 text-left font-medium">Sector</th>
              {head("base", "Baseline intensity")}
              <th scope="col" className="px-3 py-2 text-right font-medium">FY26 target</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">FY27 target</th>
              {head("cutPct27", "Cut to FY27")}
              {head("cut27", "Tonnes to cut")}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 300).map((r) => (
              <tr key={r.reg} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="max-w-md px-3 py-2">
                  <Link href={`/entity/${r.reg}`} className="font-medium text-blue-700 hover:underline dark:text-blue-400">{r.name.split(",").slice(0, 2).join(",")}</Link>
                  <div className="text-xs text-zinc-500">{r.reg} · {STATE_NAMES[r.state] ?? r.state}</div>
                </td>
                <td className="px-3 py-2">{r.sector}<div className="text-xs text-zinc-500">{r.sub}</div></td>
                <td className="px-3 py-2 text-right">{num(r.base)}</td>
                <td className="px-3 py-2 text-right">{r.t26 == null ? "—" : num(r.t26)}</td>
                <td className="px-3 py-2 text-right">{num(r.t27)}</td>
                <td className="px-3 py-2 text-right">{r.reg === "TXTOE127MH" ? "—" : pct(r.cutPct27)}</td>
                <td className="px-3 py-2 text-right">{r.reg === "TXTOE127MH" ? "—" : kt(r.cut27)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > 300 && <p className="mt-2 text-sm text-zinc-500">Showing first 300. Narrow with filters.</p>}
    </div>
  );
}
