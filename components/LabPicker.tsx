"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { EntityRow } from "@/lib/entities";
import { STATE_NAMES, kt, pct } from "@/lib/entities";

export default function LabPicker({ plants }: { plants: EntityRow[] }) {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("");
  const sectors = useMemo(() => Array.from(new Set(plants.map((p) => p.sector))), [plants]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return plants.filter((p) => (!sector || p.sector === sector)).filter((p) => !s || p.name.toLowerCase().includes(s) || p.reg.toLowerCase().includes(s) || (STATE_NAMES[p.state] ?? "").toLowerCase().includes(s)).slice(0, 60);
  }, [plants, q, sector]);
  return (
    <div>
      <input aria-label="Search plants" placeholder="Search a plant, company or state" value={q} onChange={(e) => setQ(e.target.value)}
        className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-ink placeholder:text-muted" />
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by sector">
        {["", ...sectors].map((s) => (
          <button key={s || "all"} onClick={() => setSector(s)} aria-pressed={sector === s} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${sector === s ? "border-accent bg-accent text-accentink" : "border-line text-muted hover:text-ink"}`}>{s || "All sectors"}</button>
        ))}
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {list.map((p) => (
          <li key={p.reg}>
            <Link href={`/lab/${p.reg}`} className="card block p-4 transition hover:border-accent">
              <span className="block font-medium">{p.name.split(",").slice(0, 2).join(",")}</span>
              <span className="num mt-1 block text-xs text-muted">{p.reg} · {p.sector} · {STATE_NAMES[p.state] ?? p.state} · cut {pct(p.cutPct27)} · {kt(p.cut27)}</span>
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="text-muted">No plants match.</li>}
      </ul>
    </div>
  );
}
