import Link from "next/link";
import { notFound } from "next/navigation";
import LabClient from "@/components/LabClient";
import { entities, isUnreliable } from "@/lib/entities";

export function generateStaticParams() {
  return entities.filter((e) => e.sector === "Cement").map((e) => ({ reg: e.reg }));
}

export default async function LabPage({ params }: { params: Promise<{ reg: string }> }) {
  const { reg } = await params;
  const e = entities.find((x) => x.reg === reg);
  if (!e || isUnreliable(e)) notFound();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href={`/entity/${e.reg}`} className="text-sm text-blue-700 hover:underline dark:text-blue-400">← {e.reg}</Link>
      <h1 className="mt-3 text-2xl font-semibold">Strategy Lab</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{e.name}</p>
      <LabClient entity={e} />
    </main>
  );
}
