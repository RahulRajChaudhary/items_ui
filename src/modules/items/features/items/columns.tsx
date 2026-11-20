import { ImageIcon } from "lucide-react";
import type { Column } from "@/shared/ui/DataTable";
import { formatMoney } from "@/shared/lib/format";
import type { Item } from "../../domain/types";

/** Everything a cell needs to format values; comes from useItemSettings. */
export type CellFormat = { quantity: (n: number | null) => string };

type Def = { key: string; label: string; right?: boolean; sort?: string; locked?: boolean; cell: (i: Item, f: CellFormat) => React.ReactNode };

/** The 25 selectable list columns from the wireframe, in its order. Name is locked and first. Columns without data in the API show blank. */
const DEFS: Def[] = [
  { key: "name", label: "Name", locked: true, sort: "name", cell: (i) => (
    <span className="flex items-center gap-3">
      <span className="grid h-[2.25rem] w-[2.5rem] flex-none place-items-center rounded border border-line bg-soft text-mute" aria-hidden><ImageIcon size={18} /></span>
      <span className="min-w-0 break-words font-medium text-ink underline-offset-2 group-hover:underline">{i.name}</span>
    </span>
  ) },
  { key: "sku", label: "SKU", sort: "sku", cell: (i) => i.sku },
  { key: "pdesc", label: "Purchase Description", cell: (i) => i.purchaseDescription },
  { key: "prate", label: "Purchase Rate", right: true, sort: "purchase_rate", cell: (i) => formatMoney(i.costPrice) },
  { key: "desc", label: "Description", cell: (i) => i.description },
  { key: "rate", label: "Rate", right: true, sort: "rate", cell: (i) => formatMoney(i.sellingPrice) },
  { key: "stock", label: "Stock On Hand", right: true, sort: "stock_on_hand", cell: (i, f) => (i.stockOnHand == null ? "" : f.quantity(i.stockOnHand)) },
  { key: "unit", label: "Usage Unit", cell: (i) => i.unit },
  { key: "acct", label: "Account Name", cell: (i) => i.salesAccount },
  { key: "alias", label: "Alias Name", cell: () => "" },
  { key: "avail", label: "Available for Sale", right: true, cell: (i, f) => (i.availableForSale == null ? "" : f.quantity(i.availableForSale)) },
  { key: "brand", label: "Brand", cell: (i) => i.brand },
  { key: "cat", label: "Category", cell: (i) => i.category },
  { key: "dims", label: "Dimensions", cell: () => "" },
  { key: "ean", label: "EAN", cell: () => "" },
  { key: "fund", label: "Fund Type", cell: (i) => i.fundType },
  { key: "isbn", label: "ISBN", cell: () => "" },
  { key: "mpn", label: "MPN", cell: () => "" },
  { key: "mfr", label: "Manufacturer", cell: (i) => i.manufacturer },
  { key: "pacct", label: "Purchase Account Name", cell: (i) => i.purchaseAccount },
  { key: "reorder", label: "Reorder Level", right: true, cell: (i, f) => (i.reorderLevel == null ? "" : f.quantity(i.reorderLevel)) },
  { key: "type", label: "Type", cell: (i) => (i.isService ? "Service" : "Goods") },
  { key: "upc", label: "UPC", cell: () => "" },
  { key: "vendor", label: "Vendor Name", cell: () => "" },
  { key: "weight", label: "Weight", cell: () => "" },
];

export const COLUMN_META = DEFS.map((d) => ({ key: d.key, label: d.label, locked: d.locked }));
export const DEFAULT_COLUMNS = ["name", "sku", "pdesc", "prate", "desc", "rate", "stock", "unit"];

/** Table columns for the chosen keys, in the chosen order. */
export function buildColumns(keys: string[], fmt: CellFormat, widths: Record<string, number> = {}): Column<Item>[] {
  return keys.flatMap((k) => {
    const d = DEFS.find((x) => x.key === k);
    return d ? [{ key: d.sort ?? d.key, label: d.label, align: d.right ? ("right" as const) : ("left" as const), width: widths[d.sort ?? d.key], sortable: !!d.sort, render: (i: Item) => d.cell(i, fmt) }] : [];
  });
}
