/** Money with locale digit grouping. Defaults follow the reference ERP (INR, Indian grouping); the host should pass its own locale. */
export function formatMoney(n: number | null | undefined, locale = "en-IN", currency = "INR"): string {
  if (n == null) return "-";
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2 }).format(n);
}
