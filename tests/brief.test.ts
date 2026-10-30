import { describe, expect, it } from "vitest";
import { entities } from "@/lib/entities";
import { buildFacts, untraceableNumbers } from "@/lib/brief";

const plant = entities.find((e) => e.reg === "CMTOE003AP")!;
const inputs = { price: 800, vol: 0.4, lambda: 0.5 };

describe("AI brief guardrail", () => {
  const facts = buildFacts(plant, inputs);

  it("facts come from the engine and are reproducible", () => {
    expect(buildFacts(plant, inputs)).toEqual(facts);
    expect(facts.gross_shortfall_fy27_kt).toBeCloseTo(24.1, 1);
  });

  it("accepts text whose numbers all come from the facts", () => {
    const text = `The plant must cut ${facts.required_cut_by_fy27_percent}% by FY27, ranking ${facts.peer_rank} of ${facts.peer_count}. The optimised P95 saving is ₹${facts.optimised_p95_saving_crore} crore at ₹${inputs.price} per tonne.`;
    expect(untraceableNumbers(text, facts)).toEqual([]);
  });

  it("flags a number the model invented", () => {
    const text = `The plant faces a penalty of ₹4,200 crore and a 37% cut.`;
    const bad = untraceableNumbers(text, facts);
    expect(bad).toContain("4200");
    expect(bad).toContain("37");
  });
});

describe("spelled-out numbers", () => {
  it("are surfaced instead of silently passing", () => {
    const facts = buildFacts(plant, inputs);
    expect(untraceableNumbers("The cut is one point five percent, ranking seventy third.", facts)).toContain("numbers written in words");
  });
});

describe("brief reflects the plant's own inputs", async () => {
  const { defaultTwin } = await import("@/lib/twin");
  it("lists what the user changed and the inputs used", () => {
    const t = defaultTwin(plant);
    t.outputKt = [t.outputKt[0], 2000];
    t.levers[0].costPerTonne = 450;
    t.levers[1].enabled = false;
    const f = buildFacts(plant, inputs, t);
    expect(f.changed_by_user).toContain("output for FY27");
    expect(f.changed_by_user.join(" ")).toContain("cost");
    expect(f.plant_output_fy27_kt).toBe(2000);
    expect(f.levers_modelled.find((l) => l.cost_rupees_per_tonne === 450)).toBeTruthy();
    expect(f.levers_modelled.length).toBe(t.levers.length - 1);
  });
  it("untouched defaults report no changes and carry the cheap-lever coverage", () => {
    const f = buildFacts(plant, inputs, defaultTwin(plant));
    expect(f.changed_by_user).toEqual([]);
    expect(f.share_of_fy27_shortfall_those_levers_could_cover_percent).toBeGreaterThan(0);
    expect(f.biggest_sensitivity).toBeTruthy();
  });
  it("figures the AI may quote from the new fields pass the number checker", () => {
    const f = buildFacts(plant, inputs, defaultTwin(plant));
    const text = `Output is ${f.plant_output_fy27_kt} kt and ${f.share_of_fy27_shortfall_those_levers_could_cover_percent} percent of the shortfall could be covered at Rs ${f.levers_modelled[0].cost_rupees_per_tonne} per tonne.`;
    expect(untraceableNumbers(text, f)).toEqual([]);
  });
});
