/**
 * Items list filters, from the wireframe: 19 default filters plus the fund views ("Created By Me").
 * `id` is what goes in `filter_by`; `label` is shown. Entries tied to another product (CRM, marketplace) are kept as in
 * the wireframe pending a decision (open question), with vendor names removed from the label.
 */
export type ItemFilter = { id: string; label: string };

export const DEFAULT_FILTERS: ItemFilter[] = [
  ["All", "All"], ["Active", "Active"], ["Inactive", "Inactive"], ["Sales", "Sales"], ["Purchases", "Purchases"], ["Services", "Services"],
  ["Crm", "CRM Items"], ["Inventory", "Inventory Items"], ["NonInventory", "Non-inventory Items"], ["BinTracked", "Bin Tracked Items"],
  ["Returnable", "Returnable Items"], ["NonReturnable", "Non Returnable Items"], ["ReplenishmentConfigured", "Replenishment Configured"],
  ["ReplenishmentNotConfigured", "Replenishment Not Configured"], ["ReplenishmentPaused", "Replenishment Paused"], ["Ungrouped", "Ungrouped Items"],
  ["Marketplace", "Marketplace Items"], ["Unconfirmed", "Unconfirmed Items"], ["Funds", "Funds"],
].map(([id, label]) => ({ id: id as string, label: label as string }));

export const FUND_FILTERS: ItemFilter[] = ["Revenue", "Corpus", "In Kind", "Government Grant", "Private Grant"].map((n) => ({ id: `Fund.${n}`, label: `${n} Funds` }));

/** Label for a filter id, falling back to the id. */
export function filterLabel(id: string): string {
  return [...DEFAULT_FILTERS, ...FUND_FILTERS].find((f) => f.id === id)?.label ?? id;
}
