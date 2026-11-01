import type { EntityRow } from "@/lib/entities";
import { BRAND } from "@/lib/brand";
import type { LabInputs } from "@/lib/lab";
import type { computeLab } from "@/lib/lab";
import type { TwinState } from "@/lib/twin";

const q = (v: string | number | null | undefined) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (...c: (string | number | null | undefined)[]) => c.map(q).join(",");

/** Assumptions register + results as CSV (opens in Excel). Every input carries its source. */
export function buildCsv(entity: EntityRow, inputs: LabInputs, twin: TwinState, def: TwinState, lab: ReturnType<typeof computeLab>) {
  const src = (edited: boolean, base: string) => (edited ? "User input" : base);
  const L: string[] = [];
  L.push(row(`${BRAND}: Strategy Lab export`));
  L.push(row("Plant", entity.name));
  L.push(row("Registration no.", entity.reg));
  L.push(row("Generated", new Date().toISOString().slice(0, 10)));
  L.push(row("Note", "Decision support, not advice. Lever costs cite CEEW (2023); potentials and price are assumptions unless marked User input."));
  L.push("");
  L.push(row("INPUTS", "Value", "Unit", "Source"));
  L.push(row("Output FY26", twin.outputKt[0], "kt", src(twin.outputKt[0] !== def.outputKt[0], "Gazette baseline output")));
  L.push(row("Output FY27", twin.outputKt[1], "kt", src(twin.outputKt[1] !== def.outputKt[1], "Gazette baseline output")));
  L.push(row("Unabated intensity FY26", twin.unabated[0], "tCO2e/t", src(twin.unabated[0] !== def.unabated[0], "Gazette baseline intensity")));
  L.push(row("Unabated intensity FY27", twin.unabated[1], "tCO2e/t", src(twin.unabated[1] !== def.unabated[1], "Gazette baseline intensity")));
  L.push(row("Target FY26", entity.t26 ?? "none listed", "tCO2e/t", "Gazette"));
  L.push(row("Target FY27", entity.t27, "tCO2e/t", "Gazette"));
  L.push(row("Expected CCC price FY26", inputs.price, "Rs/t", "Scenario assumption (no CCC has traded)"));
  L.push(row("Expected CCC price FY27", Math.round(inputs.price * 1.125), "Rs/t", "Scenario assumption"));
  L.push(row("Price volatility", inputs.vol, "log-vol", "Scenario assumption"));
  L.push(row("Risk aversion lambda", inputs.lambda, "", "User setting"));
  L.push(row("Discount rate", twin.discountRate, "", src(twin.discountRate !== def.discountRate, "Assumption")));
  L.push(row("Bank FY26 surplus into FY27", twin.banking ? "yes" : "no", "", "Allowed under current rules per secondary sources; confirm with CERC/BEE"));
  L.push(row("Simulated paths", lab.s.paths, "", `Seed ${lab.s.seed}`));
  L.push("");
  L.push(row("LEVERS", "Potential kt/yr", "Rs/t", "Ramp FY26", "Ramp FY27", "Delivery mean", "Delivery sd", "Source"));
  for (const l of lab.s.levers) {
    L.push(row(l.name, Math.round(l.potential / 100) / 10, l.costPerTonne, l.ramp[0], l.ramp[1], l.deliveryMean, l.deliverySd, l.source));
  }
  L.push("");
  L.push(row("RESULTS (NPV, Rs crore)", "Expected", "P5", "P50", "P95", "CVaR95", "Levers on", "Hedge %"));
  for (const { name, e } of lab.strategies) {
    const c = (x: number) => Math.round((x / 1e7) * 100) / 100;
    L.push(row(name, c(e.stats.mean), c(e.stats.p5), c(e.stats.p50), c(e.stats.p95), c(e.stats.cvar95), e.plan.levers.join("; ") || "none", Math.round(e.plan.hedge * 100)));
  }
  L.push("");
  L.push(row("Gross shortfall FY26 (kt)", Math.round(lab.gross[0] / 100) / 10));
  L.push(row("Gross shortfall FY27 (kt)", Math.round(lab.gross[1] / 100) / 10));
  return "﻿" + L.join("\r\n");
}
