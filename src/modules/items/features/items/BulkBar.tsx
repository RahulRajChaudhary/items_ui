"use client";
import { ChevronDown, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { DropdownMenu, type MenuGroup } from "@/shared/ui/DropdownMenu";

/** Transactions that can be started from the selected items (from the ERP's bulk menu). */
const NEW_TRANSACTIONS = ["New Quote", "New Sales Order", "New Invoice", "New Donation", "New Purchase Order", "New Bill", "New Purchase Return"];

/**
 * Bar that replaces the list header while rows are selected. `variant` "bar" is the full-table version
 * (buttons in a row); "menu" is the compact split-view version (one Bulk Actions menu). Shows how many are selected
 * and clears the selection. `onAction` receives the action name; actions are wired in a later phase.
 */
export function BulkBar({ count, total, onToggleAll, onClear, onAction, variant }: { count: number; total: number; onToggleAll: () => void; onClear: () => void; onAction: (name: string) => void; variant: "bar" | "menu" }) {
  const txGroup: MenuGroup = { items: NEW_TRANSACTIONS.map((t) => ({ id: t, label: t, onSelect: () => onAction(t) })) };
  const statusGroup: MenuGroup = { divider: true, items: ["Mark as Active", "Mark as Inactive", "Add Variants to an Item"].map((t) => ({ id: t, label: t, onSelect: () => onAction(t) })) };
  const selected = (
    <span className="flex items-center gap-2">
      <span className="grid size-7 place-items-center rounded-full bg-soft text-[0.8125rem] font-medium">{count}</span>
      <span>Selected</span>
    </span>
  );
  const clear = <button type="button" aria-label="Clear selection" onClick={onClear} className="cursor-pointer border-0 bg-transparent p-1 text-bad"><X size={18} /></button>;
  const all = <input type="checkbox" aria-label="Select all" checked={count > 0 && count === total} onChange={onToggleAll} className="size-4" />;

  if (variant === "menu") {
    return (
      <Card className="m-2 flex items-center gap-3 !px-3 !py-2">
        {all}
        <DropdownMenu triggerLabel="Bulk Actions" width={240} trigger={<span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-line bg-panel px-2.5 py-1.5">Bulk Actions <ChevronDown size={13} /></span>}
          groups={[{ items: [{ id: "bulk", label: "Bulk Update", onSelect: () => onAction("Bulk Update") }] }, { ...txGroup, divider: true }, statusGroup]} />
        <span className="h-5 border-l border-line" aria-hidden />
        {selected}<span className="flex-1" />{clear}
      </Card>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-3">
      {all}
      <Button onClick={() => onAction("Bulk Update")}>Bulk Update</Button>
      <DropdownMenu triggerLabel="New Transaction" width={220} trigger={<span className="inline-flex items-center gap-1.5 rounded border border-line bg-panel px-3 py-[5px]">New Transaction <ChevronDown size={13} /></span>} groups={[txGroup]} />
      <Button onClick={() => onAction("Mark as Active")}>Mark as Active</Button>
      <Button onClick={() => onAction("Mark as Inactive")}>Mark as Inactive</Button>
      <Button onClick={() => onAction("Add Variants to an Item")}>Add Variants to an Item</Button>
      <DropdownMenu triggerLabel="More bulk actions" align="right" trigger={<span className="inline-flex rounded border border-line bg-panel px-2 py-1"><MoreHorizontal size={16} /></span>}
        groups={[{ items: ["Mark as Returnable", "Mark as Non-Returnable"].map((t) => ({ id: t, label: t, onSelect: () => onAction(t) })) }]} />
      <span className="flex-1" />
      {selected}{clear}
    </div>
  );
}
