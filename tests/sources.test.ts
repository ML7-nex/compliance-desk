import { describe, expect, it } from "vitest";
import { entities } from "@/lib/entities";
import { levers, FX_INR_PER_USD, DEFAULT_RULES } from "@/lib/engine/defaults";
import { computeLab } from "@/lib/lab";
import { defaultTwin } from "@/lib/twin";
import { tornado } from "@/lib/sensitivity";

const cement = entities.find((e) => e.reg === "CMTOE003AP")!;

describe("sourced defaults", () => {
  const ls = levers(cement);
  it("every default lever cites its source", () => {
    for (const l of ls) expect(l.source).toMatch(/CEEW/);
  });
  it("alternative fuels cost is CEEW's USD 42/t converted at the stated rate", () => {
    expect(ls.find((l) => l.id === "afr")!.costPerTonne).toBe(Math.round(42 * FX_INR_PER_USD));
  });
  it("CEEW negative-cost measures are modelled at zero, not as profit", () => {
    for (const id of ["clinker", "efficiency", "whr"]) expect(ls.find((l) => l.id === id)!.costPerTonne).toBe(0);
  });
  it("rules match the BEE procedure: penalty is 2× the average price; banking on", () => {
    expect(DEFAULT_RULES.penaltyMultiple).toBe(2);
    expect(DEFAULT_RULES.bankSurplusToNextYear).toBe(true);
  });
  it("expensive levers are not chosen at analyst-range prices", () => {
    const lab = computeLab(cement, { price: 1000, vol: 0.4, lambda: 0.5 }, defaultTwin(cement));
    expect(lab.best.plan.levers).not.toContain("afr");
    expect(lab.best.plan.levers).not.toContain("re");
  });
  it("sensitivity includes lever headroom", () => {
    const lab = computeLab(cement, { price: 800, vol: 0.4, lambda: 0.5 }, defaultTwin(cement));
    const { bars } = tornado(cement, { price: 800, vol: 0.4, lambda: 0.5 }, defaultTwin(cement), lab.best.plan);
    expect(bars.some((b) => b.label.startsWith("Lever headroom"))).toBe(true);
  });
});
