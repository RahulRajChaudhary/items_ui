"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, CircleDollarSign, Pencil, RotateCcw, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { DropdownMenu } from "@/shared/ui/DropdownMenu";
import { DataTable } from "@/shared/ui/DataTable";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";
import { Tabs } from "@/shared/ui/Tabs";
import { formatMoney } from "@/shared/lib/format";
import { useUrlState } from "@/shared/hooks/useUrlState";
import { useItemsFeatures } from "../../ItemsProvider";
import type { Item } from "../../domain/types";
import { useItemSettings } from "../../settings/useItemSettings";
import { useItem } from "./hooks";
import { useItemExtras } from "./useItemExtras";
import { useItemMutations } from "./mutations";
import { SalesSummary } from "./SalesSummary";
import { ItemHistoryTab, ItemLocationsTab, ItemTransactionsTab } from "./ItemTabs";

/** Which layout an item gets. The ERP decides by whether the item tracks inventory (stock), not by its name or type:
 *  tracked goods get stock features; everything else (services, sales-only items, funds) gets the non-stock layout. */
function kindOf(i: Item): "stocked" | "service" | "nonstock" {
  if (i.tracksInventory && !i.isService) return "stocked";
  return i.isService ? "service" : "nonstock";
}

const ITEM_TYPE_TEXT = { stocked: "Inventory Items", service: "Sales and Purchase Items (Service)", nonstock: "Sales Items" } as const;

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="m-0 mb-4 flex items-baseline gap-3 text-[1.0625rem] font-normal">{title}{aside}</h3>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="m-0 grid grid-cols-[12rem_1fr] gap-x-4 gap-y-4">
      {rows.map(([l, v]) => (
        <div key={l} className="contents"><dt className="text-mute">{l}</dt><dd className="m-0">{v || "-"}</dd></div>
      ))}
    </dl>
  );
}

/** Collapsible "Associated Price Lists" heading; open it to see the lists this item belongs to. */
function PriceLists() {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="m-0 flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-[1.0625rem] text-link">
        Associated Price Lists {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <p className="mb-0 mt-3 text-mute">This item is not part of any price list.</p>}
    </section>
  );
}

function UploadBox({ label }: { label: string }) {
  return <div className="grid min-h-[4.5rem] place-items-center rounded-md border border-dashed border-line p-2 text-center text-[0.8125rem]"><span className="inline-flex items-center gap-1.5"><Upload size={14} /> {label}</span></div>;
}

/**
 * Right pane of the Items split view. The header, subtitle, tabs and Overview change with the kind of item:
 * goods get Adjust Stock, Locations and a stock panel; services get Share Hosted Payment Page and no stock;
 * funds have neither. Locations also needs the organization's Locations setting (host flag). Edits and actions
 * that need write calls (P4) only say so for now. Must not own list state.
 */
export function ItemDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const url = useUrlState();
  const q = useItem(id);
  const { formatQuantity, settings } = useItemSettings();
  const { locationsEnabled } = useItemsFeatures();
  const soon = () => toast.info("This action is built in a later phase.");
  const router = useRouter();
  const extras = useItemExtras();
  const { remove, act } = useItemMutations();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (q.isLoading) return <div className="m-5 h-40 animate-pulse rounded-[10px] bg-soft" aria-busy="true" />;
  if (q.isError || !q.data) return <div className="m-5"><Banner tone="error">{q.error?.message ?? "Could not load this item."} <Button compact onClick={() => q.refetch()}>Retry</Button></Banner></div>;
  const i = q.data;
  const kind = kindOf(i);
  const goods = kind === "stocked";
  const qty = (n: number | null) => (n == null ? "-" : formatQuantity(n));

  const tabIds = ["overview", ...(goods && locationsEnabled && settings?.inventoryEnabled !== false ? ["locations"] : []), "transactions", ...(goods && settings?.batchEnabled && i.tracking === "batch" ? ["batches"] : []), "history", ...extras.relatedLists.map((r) => `rel:${r.id}`)];
  const LABELS: Record<string, string> = { overview: "Overview", locations: "Locations", transactions: "Transactions", batches: "Batches", history: "History", ...Object.fromEntries(extras.relatedLists.map((r) => [`rel:${r.id}`, String(r.name)])) };
  const wanted = url.get("tab", "overview");
  const tab = tabIds.includes(wanted) ? wanted : "overview";

  const subtitle = kind === "service" ? "Non-Receivable Service Item" : i.returnable && goods ? "Returnable Item" : "Non-Returnable Item";

  return (
    <div className="flex min-h-0 flex-col">
      <div className="bg-panel px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="m-0 mr-auto text-[1.375rem] font-medium">{i.name}</h2>
          {i.locked && <span className="rounded-full border border-line bg-soft px-2 text-[0.6875rem]">Locked</span>}
          <Button aria-label="Edit item" onClick={() => (i.locked ? toast.error("You are restricted to perform this action Edit as the record is locked.") : router.push(`/items/edit/${id}`))}><Pencil size={14} /></Button>
          {goods && <Button variant="primary" onClick={soon}>Adjust Stock</Button>}
          {!goods && <Button onClick={soon}>Share Hosted Payment Page</Button>}
          {extras.buttons.map((b) => <Button key={b.id} onClick={() => toast.info(`"${String(b.name)}" runs on the server; button actions are not connected yet.`)}>{String(b.name)}</Button>)}
          <DropdownMenu align="right" triggerLabel="More actions" trigger={<span className="inline-flex items-center gap-1.5 rounded border border-line bg-panel px-3 py-[5px]">More <ChevronDown size={13} /></span>}
            groups={[{ items: [
              { id: "clone", label: "Clone Item", onSelect: () => act.mutate({ id, action: "clone" }, { onSuccess: (r) => r.item && url.set({ item: r.item.item_id, tab: undefined }) }) }, { id: "inactive", label: i.active ? "Mark as Inactive" : "Mark as Active", onSelect: () => act.mutate({ id, action: i.active ? "inactive" : "active" }) },
              { id: "delete", label: "Delete", danger: true, onSelect: () => setConfirmDelete(true) }, { id: "move", label: "Move to another item", onSelect: soon },
              ...(extras.lockEnabled || i.locked ? [{ id: "lock", label: i.locked ? "Unlock item" : "Lock item", onSelect: () => act.mutate({ id, action: i.locked ? "unlock" : "lock" }) }] : []),
            ] }]} />
          <button type="button" aria-label="Close item" onClick={onClose} className="cursor-pointer border-0 bg-transparent p-1.5 text-mute hover:text-ink"><X size={18} /></button>
        </div>
        <div className="mb-2 mt-1.5 flex items-center gap-1.5 text-[0.8125rem]">{goods ? <RotateCcw size={14} aria-hidden /> : <CircleDollarSign size={14} aria-hidden />}{subtitle}{!i.active && <span className="ml-2 rounded-full border border-line bg-soft px-2 text-[0.6875rem]">Inactive</span>}</div>
      </div>
      <Tabs tabs={tabIds.map((t) => ({ id: t, label: LABELS[t] ?? t }))} activeId={tab} onChange={(t) => url.set({ tab: t === "overview" ? undefined : t })} label="Item sections" />

      {tab === "overview" && (
        <div className="bg-panel">
        <div className="grid gap-8 bg-panel px-6 py-6 min-[1100px]:grid-cols-[minmax(0,1fr)_21rem]">
          <div>
            <Section title="Primary Details">
              <Rows rows={[
                ["Item Name", <span key="n" className="text-link">{i.name}</span>],
                ["Item Type", ITEM_TYPE_TEXT[kind]],
                ...(kind === "stocked" ? ([["SKU", i.sku], ["Unit", i.unit]] as [string, ReactNode][]) : []),
                ["Created Source", "User"],
                ...(goods ? ([["Inventory Account", "Finished Goods"], ["Inventory Valuation Method", i.valuationMethod === "FIFO" ? "FIFO (First In First Out)" : i.valuationMethod === "WAC" ? "Weighted Average Cost" : ""], ["Goods Received Not Invoiced Account", "Accrued Purchases"], ["Purchase Variance Account", "Purchase Price Variance"]] as [string, ReactNode][]) : []),
              ]} />
            </Section>
            <Section title="Purchase Information"><Rows rows={[["Cost Price", formatMoney(i.costPrice)], ["Purchase Account", i.purchaseAccount]]} /></Section>
            <Section title="Sales Information"><Rows rows={[["Selling Price", formatMoney(i.sellingPrice)], ["Sales Account", i.salesAccount]]} /></Section>
            {goods && <Section title="Retail Preference" aside={<button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-[0.8125rem] text-link hover:underline" onClick={soon}>Configure</button>}>
              <Rows rows={[["Fetch the item quantity from the connected weighing scale", "Disabled"], ["Calculate the quantity based on the entered amount", "Disabled"]]} />
            </Section>}
            <Section title="Reporting Tags"><p className="m-0 text-mute">No reporting tag has been associated with this item.</p></Section>
            <PriceLists />
          </div>
          <div className="flex flex-col gap-4">
            <Card variant="group"><div className="grid grid-cols-2 gap-3 p-2">
              <div className="flex flex-col gap-2"><span>Front View</span><UploadBox label="Upload Front Image" /><span>Rear View</span><UploadBox label="Upload Rear Image" /></div>
              <div className="flex flex-col gap-2"><span>Other Images</span><div className="grid flex-1 place-items-center rounded-md border border-dashed border-line p-3 text-center"><span><Upload size={18} className="mx-auto mb-1" /><b className="block font-medium">Drag &amp; Drop Images</b><small className="text-mute">You can add up to 15 images including front, rear and other images, each not exceeding 5 MB.</small></span></div></div>
            </div></Card>
            {goods && settings?.inventoryEnabled !== false && (
              <div className="rounded-md bg-soft p-4">
                <div className="mb-3">Opening Stock <b>: {qty(0)}</b></div>
                <b className="text-[1rem]">Stock Details</b>
                <dl className="my-3 grid grid-cols-[10rem_1fr] gap-y-2">
                  <dt className="underline decoration-dotted">Stock on Hand</dt><dd className="m-0">: {qty(i.stockOnHand)}</dd>
                  <dt className="underline decoration-dotted">Committed Stock</dt><dd className="m-0">: {qty(i.committed ?? 0)}</dd>
                  <dt className="underline decoration-dotted">Available for Sale</dt><dd className="m-0">: {qty(i.availableForSale)}</dd>
                </dl>
                <div className="grid grid-cols-2 gap-2">
                  {["To be Shipped", "To be Received", "To be Invoiced", "To be Billed"].map((t) => (
                    <Card key={t} variant="group"><div className="p-1.5"><b className="text-[1.125rem] font-medium">0</b> <small className="text-mute">Qty</small><div className="text-[0.75rem]">{t}</div></div></Card>
                  ))}
                </div>
                <div className="mt-3"><span className="text-mute">Reorder Point</span> <b>{qty(i.reorderLevel)}</b></div>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 pb-8"><SalesSummary /></div>
        </div>
      )}
      {tab === "locations" && <ItemLocationsTab id={id} qty={qty} />}
      {tab === "transactions" && <ItemTransactionsTab id={id} qty={qty} />}
      {tab === "batches" && <EmptyState title="No batches yet" text="Batches are created from inward transactions." />}
      {tab === "history" && <ItemHistoryTab id={id} />}
      {tab.startsWith("rel:") && (
        <div className="bg-panel px-6 py-5">
          <DataTable hideFooter wrap state="ready" rows={[i]} rowKey={(x) => x.id} onRetry={() => {}} emptyState={null} page={{ page: 1, perPage: 25, hasMore: false, onChange: () => {} }}
            columns={[{ key: "n", label: "Name", render: (x) => x.name }, { key: "a", label: "Account Name", render: (x) => x.salesAccount }, { key: "s", label: "Status", render: (x) => (x.active ? "Active" : "Inactive") }, { key: "r", label: "Rate", align: "right", render: (x) => formatMoney(x.sellingPrice) }]} />
        </div>
      )}
      <Modal title="Delete item?" open={confirmDelete} onClose={() => setConfirmDelete(false)} size="sm" footer={<><Button variant="danger" disabled={remove.isPending} onClick={() => remove.mutate(id, { onSuccess: () => { setConfirmDelete(false); onClose(); } })}>Delete</Button><Button onClick={() => setConfirmDelete(false)}>Cancel</Button></>}>
        &quot;{i.name}&quot; will be deleted. This cannot be undone.
      </Modal>
    </div>
  );
}
