import LabPicker from "@/components/LabPicker";
import { entities, isUnreliable } from "@/lib/entities";

export const metadata = { title: "Strategy Lab | Compliance Desk" };

export default function LabIndex() {
  const plants = entities.filter((e) => !isUnreliable(e)).sort((a, b) => b.cut27 - a.cut27);
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="eyebrow text-accent">Strategy Lab</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Pick a plant to model</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Simulate thousands of carbon-credit price paths and find the cheapest mix of abatement, spot buying and hedging. Enter your own plant numbers once inside. Cement plants start with a default lever library; other sectors can add their own levers.
      </p>
      <div className="mt-6"><LabPicker plants={plants} /></div>
    </main>
  );
}
