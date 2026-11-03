"use client";
import dynamic from "next/dynamic";
import type { EntityRow } from "@/lib/entities";

// The sums run in the browser, so skip rendering this on the server (faster builds, instant shell).
const LabClient = dynamic(() => import("@/components/LabClient"), {
  ssr: false,
  loading: () => (
    <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading Strategy Lab">
      {[0, 1, 2].map((i) => <div key={i} className="card h-24 animate-pulse" />)}
    </div>
  ),
});

export default function LabLoader({ entity }: { entity: EntityRow }) {
  return <LabClient entity={entity} />;
}
