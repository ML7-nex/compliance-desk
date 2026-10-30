"use client";
import type { EntityRow } from "@/lib/entities";
import { num } from "@/lib/entities";
import { MAX_LEVERS, isCustomised, leverChanged, newLever, type TwinLever, type TwinState } from "@/lib/twin";

function Field({ label, value, onChange, edited, step = "any", suffix, source, min = 0 }: { label: string; value: number; onChange: (v: number) => void; edited: boolean; step?: string; suffix?: string; source: string; min?: number }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span className={`rounded-full border px-1.5 py-px text-[10px] ${edited ? "border-accent text-accent" : "border-line"}`}>{edited ? "your input" : source}</span>
      </span>
      <span className="mt-1 flex items-center rounded-lg border border-line bg-surface2 focus-within:border-accent">
        <input type="number" inputMode="decimal" min={min} step={step} value={Number.isFinite(value) ? value : 0}
          onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) onChange(v); }}
          className="num w-full bg-transparent px-3 py-2 text-sm text-ink outline-none" />
        {suffix && <span className="pr-3 text-xs text-muted">{suffix}</span>}
      </span>
    </label>
  );
}

export default function TwinForm({ entity, def, twin, onChange, onReset }: { entity: EntityRow; def: TwinState; twin: TwinState; onChange: (t: TwinState) => void; onReset: () => void }) {
  const set = (patch: Partial<TwinState>) => onChange({ ...twin, ...patch });
  const setLever = (id: string, patch: Partial<TwinLever>) => onChange({ ...twin, levers: twin.levers.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const custom = isCustomised(def, twin);
  const unit = entity.unit === "MBBLS" ? "kMBBLS×NRGF" : "kt";
  const pair = (key: "outputKt" | "unabated", i: 0 | 1, v: number) => { const a = [...twin[key]] as [number, number]; a[i] = v; set({ [key]: a } as Partial<TwinState>); };

  return (
    <section className="card mt-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow text-accent">Plant twin</div>
          <h2 className="mt-1 text-lg font-semibold">Your plant&apos;s numbers</h2>
        </div>
        <div className="flex items-center gap-3">
          {custom && <span className="rounded-full border border-accent px-2.5 py-1 text-xs text-accent">customised</span>}
          <button onClick={onReset} disabled={!custom} className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition hover:text-ink disabled:opacity-40">Reset to atlas defaults</button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">Starts from the gazette baseline. Change anything to match your plant. Inputs are saved in this browser only and are not uploaded; only the optional AI brief sends the resulting figures to the server.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={`Output FY26 (${unit})`} value={twin.outputKt[0]} onChange={(v) => pair("outputKt", 0, v)} edited={twin.outputKt[0] !== def.outputKt[0]} source="gazette baseline" />
        <Field label={`Output FY27 (${unit})`} value={twin.outputKt[1]} onChange={(v) => pair("outputKt", 1, v)} edited={twin.outputKt[1] !== def.outputKt[1]} source="gazette baseline" />
        <Field label="Unabated intensity FY26" step="0.0001" value={twin.unabated[0]} onChange={(v) => pair("unabated", 0, v)} edited={twin.unabated[0] !== def.unabated[0]} source="gazette baseline" />
        <Field label="Unabated intensity FY27" step="0.0001" value={twin.unabated[1]} onChange={(v) => pair("unabated", 1, v)} edited={twin.unabated[1] !== def.unabated[1]} source="gazette baseline" />
      </div>
      <p className="num mt-3 text-xs text-muted">
        Notified targets (fixed by the gazette): FY26 {entity.t26 == null ? "none listed" : num(entity.t26)} · FY27 {num(entity.t27)}.
        Shortfall = output × (unabated intensity − target).
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Discount rate" suffix="%" step="0.5" value={twin.discountRate * 100} onChange={(v) => set({ discountRate: v / 100 })} edited={twin.discountRate !== def.discountRate} source="assumption" />
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" checked={twin.banking} onChange={(e) => set({ banking: e.target.checked })} className="h-4 w-4" />
          <span>Bank FY26 surplus into FY27 <span className="text-xs text-muted">(unconfirmed rule)</span></span>
        </label>
      </div>

      <h3 className="mt-6 text-sm font-semibold">Abatement levers</h3>
      <p className="mt-1 text-xs text-muted">
        {twin.levers.length === 0 ? "No default levers exist for this sector yet. Add your own to compare abatement against buying credits." : "Costs and potentials start as uncited placeholders. Replace them with your own figures."}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="num w-full min-w-[860px] text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wider text-muted">
            <tr><th className="py-2 pr-2">On</th><th className="pr-2">Lever</th><th className="pr-2">Potential kt/yr</th><th className="pr-2">₹ per t</th><th className="pr-2">Ramp FY26 %</th><th className="pr-2">Ramp FY27 %</th><th className="pr-2">Delivery %</th><th className="pr-2">± %</th><th /></tr>
          </thead>
          <tbody>
            {twin.levers.map((l) => {
              const cell = (field: keyof TwinLever, value: number, scale: number, on: (v: number) => void, step = "any") => (
                <td className="pr-2 pb-2">
                  <input type="number" min={0} step={step} value={Math.round(value * scale * 1000) / 1000}
                    onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) on(v / scale); }}
                    aria-label={`${l.name} ${String(field)}`}
                    className={`w-24 rounded-lg border bg-surface2 px-2 py-1.5 text-sm outline-none focus:border-accent ${leverChanged(def, l, field) ? "border-accent/60" : "border-line"}`} />
                </td>
              );
              return (
                <tr key={l.id} className={`border-t border-line ${l.enabled ? "" : "opacity-50"}`}>
                  <td className="py-2 pr-2"><input type="checkbox" aria-label={`Include ${l.name}`} checked={l.enabled} onChange={(e) => setLever(l.id, { enabled: e.target.checked })} className="h-4 w-4" /></td>
                  <td className="pr-2 pb-2">
                    {l.custom
                      ? <input value={l.name} maxLength={32} aria-label="Lever name" onChange={(e) => setLever(l.id, { name: e.target.value })} className="w-44 rounded-lg border border-line bg-surface2 px-2 py-1.5 text-sm outline-none focus:border-accent" />
                      : <span className="inline-block w-44 pt-1.5">{l.name}</span>}
                  </td>
                  {cell("potentialKt", l.potentialKt, 1, (v) => setLever(l.id, { potentialKt: v }))}
                  {cell("costPerTonne", l.costPerTonne, 1, (v) => setLever(l.id, { costPerTonne: v }))}
                  {cell("ramp", l.ramp[0], 100, (v) => setLever(l.id, { ramp: [Math.min(1, v), l.ramp[1]] }))}
                  {cell("ramp", l.ramp[1], 100, (v) => setLever(l.id, { ramp: [l.ramp[0], Math.min(1, v)] }))}
                  {cell("deliveryMean", l.deliveryMean, 100, (v) => setLever(l.id, { deliveryMean: v }))}
                  {cell("deliverySd", l.deliverySd, 100, (v) => setLever(l.id, { deliverySd: v }))}
                  <td className="pb-2 text-right">
                    {l.custom && <button onClick={() => onChange({ ...twin, levers: twin.levers.filter((x) => x.id !== l.id) })} className="text-xs text-muted hover:text-danger" aria-label={`Remove ${l.name}`}>Remove</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button disabled={twin.levers.length >= MAX_LEVERS} onClick={() => onChange({ ...twin, levers: [...twin.levers, newLever(twin.levers)] })}
        className="mt-2 rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-accent disabled:opacity-40">
        + Add lever {twin.levers.length >= MAX_LEVERS ? `(max ${MAX_LEVERS})` : ""}
      </button>
    </section>
  );
}
