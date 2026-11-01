"use client";
import { useEffect, useState, type ReactNode } from "react";

/** Details panel that only renders its children when open (keeps heavy charts off the page until wanted) and opens fully when printing. */
export default function Collapsible({ title, hint, children, defaultOpen = false }: { title: string; hint: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const on = () => setPrinting(true);
    const off = () => setPrinting(false);
    window.addEventListener("beforeprint", on);
    window.addEventListener("afterprint", off);
    return () => { window.removeEventListener("beforeprint", on); window.removeEventListener("afterprint", off); };
  }, []);
  const show = open || printing;
  return (
    <section className="card mt-3 overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={show} className="no-print flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-surface2">
        <span>
          <span className="block font-semibold">{title}</span>
          <span className="mt-0.5 block text-sm text-muted">{hint}</span>
        </span>
        <span aria-hidden className={`text-xl text-muted transition-transform ${show ? "rotate-45" : ""}`}>+</span>
      </button>
      {show && <div className="flat border-t border-line px-1 pb-4 pt-1 print:border-0"><h3 className="hidden px-4 pt-3 text-lg font-semibold print:block">{title}</h3>{children}</div>}
    </section>
  );
}
