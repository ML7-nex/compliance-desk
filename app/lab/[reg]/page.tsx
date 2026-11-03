import Link from "next/link";
import { notFound } from "next/navigation";
import LabLoader from "@/components/LabLoader";
import { entities, isUnreliable } from "@/lib/entities";

export function generateStaticParams() {
  return entities.filter((e) => !isUnreliable(e)).map((e) => ({ reg: e.reg }));
}

export default async function LabPage({ params }: { params: Promise<{ reg: string }> }) {
  const { reg } = await params;
  const e = entities.find((x) => x.reg === reg);
  if (!e || isUnreliable(e)) notFound();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href={`/entity/${e.reg}`} className="text-sm text-muted hover:text-accent">← {e.reg}</Link>
      <p className="eyebrow mt-4 text-accent">Strategy Lab</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{e.name.split(",").slice(0, 2).join(",")}</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Your legal target and 2023-24 baseline are already filled in from the gazette. You can adjust the numbers under &quot;Go deeper&quot; to match your plant&apos;s real situation. Nothing is required: the defaults give a first answer.
      </p>
      <p role="note" className="mt-3 max-w-3xl rounded-lg border border-line bg-surface p-3 text-xs text-muted">
        <strong className="text-ink">Privacy:</strong> the target and baseline shown here are public gazette data. Everything you type, and the results, stay in <em>this browser only</em>: nothing is uploaded or shared, and other visitors cannot see it. The one exception is the optional AI brief, which sends your current figures to our server and to Google&apos;s Gemini service to write the text. Nothing is stored by us. On a shared computer, use &quot;Reset to atlas defaults&quot; when you finish.
      </p>
      <LabLoader entity={e} />
    </main>
  );
}
