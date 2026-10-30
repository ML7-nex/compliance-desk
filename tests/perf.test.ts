import { it, expect } from "vitest";
import { entities } from "@/lib/entities";
import { scenarioFor } from "@/lib/engine/defaults";
import { optimise } from "@/lib/engine/optimise";

it("full optimisation (32 lever sets × 5 hedge levels × 10,000 paths) completes within 3 s", () => {
  const e = entities.find((x) => x.reg === "CMTOE003AP")!;
  const t = performance.now();
  optimise(scenarioFor(e), 0.5);
  const ms = performance.now() - t;
  console.log("optimise ms", Math.round(ms));
  expect(ms).toBeLessThan(3000);
});
