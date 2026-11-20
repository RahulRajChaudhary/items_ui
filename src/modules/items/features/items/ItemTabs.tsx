"use client";
import { useMemo, useState } from "react";
import { ChevronDown, Settings, Star } from "lucide-react";
import { toast } from "sonner";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/Button";
import { DataTable } from "@/shared/ui/DataTable";
import { DropdownMenu } from "@/shared/ui/DropdownMenu";
import { EmptyState } from "@/shared/ui/EmptyState";
import { formatMoney } from "@/shared/lib/format";
import { useItemHistory, useItemLocations, useItemTransactions } from "./hooks";

const noPaging = { page: 1, perPage: 25, hasMore: false, onChange: () => {} };
const soon = () => toast.info("This action is built in a later phase.");

/** Pill-style filter: "Label: value ▾" that opens a list. Used for the Transactions filters and the location filter. */
function FilterPill({ label, value, options, onPick }: { label: string; value: string; options: string[]; onPick: (v: string) => void }) {
  return (
    <DropdownMenu triggerLabel={label} width={220} trigger={<span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-soft px-3 py-2"><span className="text-mute">{label}:</span> <b className="font-medium">{value}</b><ChevronDown size={13} /></span>}
      groups={[{ items: options.map((o) => ({ id: o, label: o, checked: o === value, onSelect: () => onPick(o) })) }]} />
  );
}

/**
 * Locations tab: Stock Locations with its gear menu, the Location Permission filter (All Locations, or Specific
 * Locations picked from a searchable checklist with Remove All), and the per-location stock table.
 * `qty` formats quantities with the organization's decimal places. Must not fetch outside its hook.
 */
export function ItemLocationsTab({ id, qty }: { id: string; qty: (n: number | null) => string }) {
  const q = useItemLocations(id, true);
  const [mode, setMode] = useState<"all" | "specific">("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const rows = useMemo(() => (q.data ?? []).filter((l) => mode === "all" || picked.has(l.location_id)), [q.data, mode, picked]);
  const toggle = (lid: string) => setPicked((s) => { const n = new Set(s); if (n.has(lid)) n.delete(lid); else n.add(lid); return n; });
  if (q.isError) return <div className="m-5"><Banner tone="error">{q.error.message} <Button compact onClick={() => q.refetch()}>Retry</Button></Banner></div>;
  return (
    <div className="bg-panel px-6 py-5">
      <div className="mb-5 flex items-center gap-3">
        <h3 className="m-0 text-[1.125rem] font-normal">Stock Locations</h3>
        <DropdownMenu triggerLabel="Location actions" width={230} trigger={<span className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5"><Settings size={14} /><ChevronDown size={12} /></span>}
          groups={[{ items: [{ id: "open", label: "Add Opening Stock", onSelect: soon }, { id: "repl", label: "Configure Replenishment", onSelect: soon }] }]} />
      </div>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <div className="mb-1.5">Location Permission</div>
          <DropdownMenu triggerLabel="Location Permission" width={260} searchable trigger={<span className="inline-flex w-[16rem] items-center justify-between rounded-md border border-line bg-panel px-3 py-2.5"><span>{mode === "all" ? "All Locations" : "Specific Locations"}</span><ChevronDown size={14} /></span>}
            groups={[{ items: [{ id: "all", label: "All Locations", checked: mode === "all", onSelect: () => setMode("all") }, { id: "specific", label: "Specific Locations", checked: mode === "specific", onSelect: () => setMode("specific") }] }]} />
        </div>
        {mode === "specific" && (
          <div>
            <div className="mb-1.5">Choose locations</div>
            <DropdownMenu triggerLabel="Choose locations" width={300} searchable
              trigger={<span className="inline-flex w-[16rem] items-center justify-between rounded-md border border-line bg-panel px-3 py-2.5"><span>{picked.size ? `${picked.size} selected` : "Select locations"}</span><ChevronDown size={14} /></span>}
              groups={[{ items: (q.data ?? []).map((l) => ({ id: l.location_id, label: l.location_name, checked: picked.has(l.location_id), keepOpen: true, onSelect: () => toggle(l.location_id) })) }]}
              footer={{ id: "clear", label: "Remove All", keepOpen: true, onSelect: () => setPicked(new Set()) }} />
          </div>
        )}
      </div>
      <DataTable hideFooter wrap state={q.isPending ? "loading" : rows.length === 0 ? "empty" : "ready"} rows={rows} rowKey={(l) => l.location_id} onRetry={() => q.refetch()} page={noPaging}
        emptyState={<EmptyState title={mode === "specific" && picked.size === 0 ? "Choose at least one location" : "No stock locations"} />}
        columns={[
          { key: "n", label: "Location Name", render: (l) => <span className="inline-flex items-center gap-1.5">{l.location_name}{l.is_primary && <Star size={14} className="fill-current text-warn" aria-label="Primary location" />}</span> },
          { key: "s", label: "Stock On Hand", align: "right", render: (l) => qty(l.stock_on_hand) },
          { key: "c", label: "Committed Stock", align: "right", render: (l) => qty(l.committed_stock) },
          { key: "a", label: "Available For Sale", align: "right", render: (l) => qty(l.available_for_sale) },
        ]} />
    </div>
  );
}

/** Transactions tab: the two filter pills and the quotes table. Only quotes are loaded (the one type seen live). */
export function ItemTransactionsTab({ id, qty }: { id: string; qty: (n: number | null) => string }) {
  const q = useItemTransactions(id);
  const [status, setStatus] = useState("All");
  const rows = (q.data ?? []).filter((t) => status === "All" || t.status === status);
  return (
    <div className="bg-panel px-6 py-5">
      <div className="mb-4 flex gap-3">
        <FilterPill label="Filter By" value="Quotes" options={["Quotes"]} onPick={() => {}} />
        <FilterPill label="Status" value={status} options={["All", "Draft", "Sent", "Accepted", "Declined", "Invoiced"]} onPick={setStatus} />
      </div>
      <DataTable hideFooter wrap state={q.isPending ? "loading" : q.isError ? "error" : rows.length === 0 ? "empty" : "ready"} rows={rows} rowKey={(t) => t.transaction_id} errorMessage={q.error?.message} onRetry={() => q.refetch()} page={noPaging}
        emptyState={<EmptyState title="No transactions found" text="Quotes that use this item will be listed here." />}
        columns={[
          { key: "d", label: "Date", render: (t) => new Date(t.date).toLocaleDateString("en-GB") },
          { key: "n", label: "Quote Number", render: (t) => t.number },
          { key: "c", label: "Customer Name", render: (t) => t.customer_name },
          { key: "q", label: "Quantity Sold", render: (t) => qty(t.quantity) },
          { key: "r", label: "Price", align: "right", render: (t) => formatMoney(t.rate) },
          { key: "t", label: "Total", align: "right", render: (t) => formatMoney(t.total) },
          { key: "s", label: "Status", render: (t) => <span className={t.status === "Invoiced" ? "text-ok" : ""}>{t.status}</span> },
        ]} />
    </div>
  );
}

/** History tab: date and what happened, newest first. */
export function ItemHistoryTab({ id }: { id: string }) {
  const q = useItemHistory(id);
  const rows = q.data ?? [];
  return (
    <div className="bg-panel px-6 py-5">
      <DataTable hideFooter wrap state={q.isPending ? "loading" : q.isError ? "error" : rows.length === 0 ? "empty" : "ready"} rows={rows} rowKey={(h) => h.history_id} errorMessage={q.error?.message} onRetry={() => q.refetch()} page={noPaging}
        emptyState={<EmptyState title="No history yet" text="Changes made to this item will be listed here." />}
        columns={[
          { key: "d", label: "Date", render: (h) => new Date(h.date).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) },
          { key: "x", label: "Details", render: (h) => <span>{h.details} <i className="text-mute">- {h.by}</i></span> },
        ]} />
    </div>
  );
}
