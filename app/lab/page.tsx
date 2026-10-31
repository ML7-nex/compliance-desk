import LabPicker from "@/components/LabPicker";
import { entities, isUnreliable } from "@/lib/entities";

export const metadata = { title: "Strategy Lab | Compliance Desk" };

export default function LabIndex() {
  const plants = entities.filter((e) => !isUnreliable(e)).sort((a, b) => b.cut27 - a.cut27);
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="eyebrow text-accent">Strategy Lab</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Find your plant</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Every plant with a legal emissions target is listed, so finding your plant loads your target and baseline from the gazette automatically. Then adjust the numbers to match your plant and see the cheapest mix of cutting emissions, buying credits and locking in a price. Cement plants start with a sourced lever library; other sectors add their own.
      </p>
      <div className="mt-6"><LabPicker plants={plants} /></div>
    </main>
  );
}
