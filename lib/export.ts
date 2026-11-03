import type { EntityRow } from "@/lib/entities";
import { BRAND } from "@/lib/brand";
import type { PlantInputs, Result } from "@/lib/simple";

const q = (v: string | number | null | undefined) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (...c: (string | number | null | undefined)[]) => c.map(q).join(",");
const crore = (x: number | null) => (x == null ? "not possible" : Math.round((x / 1e7) * 100) / 100);

/** Inputs, sources and the three costs as CSV (opens in Excel). */
export function buildCsv(
  entity: EntityRow, inputs: PlantInputs, def: PlantInputs, price: number, result: Result,
  rows: { price: number; buy: number; abate: number | null; mix: number }[],
) {
  const src = (edited: boolean, base: string) => (edited ? "User input" : base);
  const L: string[] = [];
  L.push(row(`${BRAND}: Strategy Lab export`));
  L.push(row("Plant", entity.name));
  L.push(row("Registration no.", entity.reg));
  L.push(row("Generated", new Date().toISOString().slice(0, 10)));
  L.push(row("Note", "Decision support, not advice. Abatement costs cite CEEW (2023); what each abatement can cut at the plant is a placeholder unless marked User input."));
  L.push("");
  L.push(row("INPUTS", "Value", "Unit", "Source"));
  L.push(row("Cement output", inputs.outputKt, "thousand tonnes a year", src(inputs.outputKt !== def.outputKt, "Gazette 2023-24 output")));
  L.push(row("CO2 per tonne of cement without action", inputs.intensityNow, "tCO2 per tonne", src(inputs.intensityNow !== def.intensityNow, "Gazette 2023-24 baseline")));
  L.push(row("FY27 target", entity.t27, "tCO2 per tonne", "Gazette G.S.R. 739(E)"));
  L.push(row("Gap to cut by FY27", Math.round(result.gapT / 100) / 10, "thousand tonnes a year", "Output x (CO2 per tonne now minus target)"));
  L.push(row("Credit price assumed", price, "Rs per tonne", "Scenario chosen by the user (no credit has traded; analysts expect Rs 600 to 1,200)"));
  L.push("");
  L.push(row("ABATEMENTS", "On", "Can cut (kt a year)", "Cost (Rs per tonne)", "Source"));
  for (const a of inputs.abatements) L.push(row(a.name, a.enabled ? "yes" : "no", Math.round(a.potentialKt * 100) / 100, a.costPerTonne, a.edited || a.custom ? "User input" : a.source));
  L.push("");
  L.push(row("THREE WAYS TO COVER THE GAP", "Cost (Rs crore a year)", "Cut by abatements (kt)", "Credits bought (kt)", "Abatements used"));
  for (const o of result.options) {
    const cut = o.uses.reduce((t, u) => t + u.tonnes, 0);
    L.push(row(o.name + (o.key === result.bestKey ? " (cheapest)" : ""), crore(o.total), Math.round(cut / 100) / 10, Math.round(o.boughtT / 100) / 10, o.uses.map((u) => `${u.name} ${Math.round(u.tonnes / 100) / 10} kt`).join("; ") || "none"));
  }
  L.push("");
  L.push(row("IF THE CREDIT PRICE IS DIFFERENT (Rs crore a year)", "Buy all the credits", "Cut it all with abatements", "Abatements first, buy the rest"));
  for (const r of rows) L.push(row(`Rs ${r.price} per tonne`, crore(r.buy), crore(r.abate), crore(r.mix)));
  return "﻿" + L.join("\r\n");
}
