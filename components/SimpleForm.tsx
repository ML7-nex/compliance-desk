"use client";
import { MAX_ABATEMENTS, isCustomised, newAbatement, type Abatement, type PlantInputs } from "@/lib/simple";

function Num({ label, value, onChange, edited, step = "any", hint }: { label: string; value: number; onChange: (v: number) => void; edited: boolean; step?: string; hint: string }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span className={`rounded-full border px-1.5 py-px text-[10px] ${edited ? "border-accent text-accent" : "border-line"}`}>{edited ? "your input" : hint}</span>
      </span>
      <input type="number" inputMode="decimal" min={0} step={step} value={Number.isFinite(value) ? value : 0}
        onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) onChange(v); }}
        className="num mt-1 w-full rounded-lg border border-line bg-surface2 px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
    </label>
  );
}

export default function SimpleForm({ def, cur, onChange, onReset }: { def: PlantInputs; cur: PlantInputs; onChange: (p: PlantInputs) => void; onReset: () => void }) {
  const custom = isCustomised(def, cur);
  const setA = (id: string, patch: Partial<Abatement>) =>
    onChange({ ...cur, abatements: cur.abatements.map((a) => (a.id === id ? { ...a, ...patch, edited: a.edited || !(Object.keys(patch).length === 1 && "enabled" in patch) } : a)) });
  const changed = (a: Abatement, f: "potentialKt" | "costPerTonne") => { const b = def.abatements.find((x) => x.id === a.id); return !b || b[f] !== a[f]; };

  return (
    <section className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Adjust to your plant&apos;s real numbers <span className="text-sm font-normal text-muted">(optional)</span></h2>
        <div className="flex items-center gap-3">
          {custom && <span className="rounded-full border border-accent px-2.5 py-1 text-xs text-accent">customised</span>}
          <button onClick={onReset} disabled={!custom} className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition hover:text-ink disabled:opacity-40">Reset to atlas defaults</button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">Starts from the gazette numbers. Change anything to match your plant. Saved in this browser only; nothing is uploaded.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Num label="Cement the plant will make (thousand tonnes a year)" value={cur.outputKt} onChange={(v) => onChange({ ...cur, outputKt: v })} edited={cur.outputKt !== def.outputKt} hint="gazette 2023-24" />
        <Num label="CO₂ per tonne of cement if you do nothing" step="0.0001" value={cur.intensityNow} onChange={(v) => onChange({ ...cur, intensityNow: v })} edited={cur.intensityNow !== def.intensityNow} hint="gazette baseline" />
      </div>

      <h3 className="mt-6 text-sm font-semibold">Abatements: ways to cut CO₂ yourself</h3>
      <p role="note" className="mt-2 rounded-lg border border-warn/40 bg-warn/10 p-2.5 text-xs text-warn">
        Cheap abatements only help if your plant has not already done them. &quot;Can cut&quot; is the biggest thing this tool cannot know, so set it to what you can still realistically deliver.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="num w-full min-w-[640px] text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wider text-muted">
            <tr><th className="py-2 pr-2">On</th><th className="pr-2">Abatement</th><th className="pr-2">Can cut (kt a year)</th><th className="pr-2">Cost (₹ per tonne)</th><th /></tr>
          </thead>
          <tbody>
            {cur.abatements.map((a) => (
              <tr key={a.id} className={`border-t border-line ${a.enabled ? "" : "opacity-50"}`}>
                <td className="py-2 pr-2"><input type="checkbox" aria-label={`Include ${a.name}`} checked={a.enabled} onChange={(e) => setA(a.id, { enabled: e.target.checked })} className="h-4 w-4" /></td>
                <td className="pr-2 pb-2">
                  {a.custom
                    ? <input value={a.name} maxLength={36} aria-label="Abatement name" onChange={(e) => setA(a.id, { name: e.target.value })} className="w-52 rounded-lg border border-line bg-surface2 px-2 py-1.5 text-sm outline-none focus:border-accent" />
                    : <span className="inline-block w-52 pt-1.5">{a.name}</span>}
                </td>
                <td className="pr-2 pb-2"><input type="number" min={0} step="any" aria-label={`${a.name} can cut`} value={Math.round(a.potentialKt * 100) / 100} onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) setA(a.id, { potentialKt: v }); }} className={`w-28 rounded-lg border bg-surface2 px-2 py-1.5 text-sm outline-none focus:border-accent ${changed(a, "potentialKt") ? "border-accent/60" : "border-line"}`} /></td>
                <td className="pr-2 pb-2"><input type="number" min={0} step="any" aria-label={`${a.name} cost`} value={a.costPerTonne} onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) setA(a.id, { costPerTonne: v }); }} className={`w-28 rounded-lg border bg-surface2 px-2 py-1.5 text-sm outline-none focus:border-accent ${changed(a, "costPerTonne") ? "border-accent/60" : "border-line"}`} /></td>
                <td className="pb-2 text-right">{a.custom && <button onClick={() => onChange({ ...cur, abatements: cur.abatements.filter((x) => x.id !== a.id) })} className="text-xs text-muted hover:text-danger" aria-label={`Remove ${a.name}`}>Remove</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button disabled={cur.abatements.length >= MAX_ABATEMENTS} onClick={() => onChange({ ...cur, abatements: [...cur.abatements, newAbatement(cur.abatements)] })}
        className="mt-2 rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-accent disabled:opacity-40">
        + Add an abatement {cur.abatements.length >= MAX_ABATEMENTS ? `(max ${MAX_ABATEMENTS})` : ""}
      </button>
    </section>
  );
}
