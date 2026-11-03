/** Money in ₹: crore for large figures, lakh below ₹1 crore so small plants don't round to zero. */
export function money(x: number): string {
  const sign = x < 0 ? "−" : "";
  const a = Math.abs(x);
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toLocaleString("en-IN", { maximumFractionDigits: a >= 1e8 ? 1 : 2 })} cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 1 })} lakh`;
  return `${sign}₹${Math.round(a).toLocaleString("en-IN")}`;
}

/** Tonnes as kt with enough decimals that small plants don't show 0. */
export function ktText(t: number): string {
  const k = t / 1000;
  return `${k.toLocaleString("en-IN", { maximumFractionDigits: Math.abs(k) < 10 ? 1 : 0 })} kt`;
}
