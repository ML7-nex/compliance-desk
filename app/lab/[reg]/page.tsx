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
      <LabLoader entity={e} />
    </main>
  );
}
