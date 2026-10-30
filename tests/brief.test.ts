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
