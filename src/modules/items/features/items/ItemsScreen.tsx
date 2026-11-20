"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, LayoutGrid, List, MoreHorizontal, Plus, RefreshCw, RotateCcw, Rows3, Settings, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { ColumnCustomizer } from "@/shared/ui/ColumnCustomizer";
import { DataTable } from "@/shared/ui/DataTable";
import { DropdownMenu, type MenuGroup, type MenuItem } from "@/shared/ui/DropdownMenu";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pager } from "@/shared/ui/Pager";
import { ListRow, MasterDetail } from "@/shared/ui/MasterDetail";
import { useUrlState } from "@/shared/hooks/useUrlState";
import { formatMoney } from "@/shared/lib/format";
import { DEFAULT_FILTERS, FUND_FILTERS, filterLabel } from "../../domain/filters";
import { useItemSettings } from "../../settings/useItemSettings";
import { COLUMN_META, DEFAULT_COLUMNS, buildColumns } from "./columns";
import { BulkBar } from "./BulkBar";
import { ItemDetail } from "./ItemDetail";
import { useItemsList } from "./hooks";
import { useItemMutations } from "./mutations";
import { useColumnLayout } from "./useColumnLayout";

/**
 * The Items screen: list (table or grid), collapsed view, and the split view with the item detail.
 * Filter, sort, page, view and the selected item live in the URL. Must not call the API directly (hooks do).
 */
export function ItemsScreen() {
  const url = useUrlState();
  const router = useRouter();
  const { formatQuantity } = useItemSettings();
  const filter = url.get("filter", "Active");
  const sort = url.get("sort", "name");
  const order = url.get("order", "A") === "D" ? "D" : "A";
  const page = Math.max(1, Number(url.get("page", "1")));
  const perPage = Number(url.get("per", "25"));
  const mode = url.get("mode", "list") === "grid" ? "grid" : "list";
  const collapsedView = url.get("view") === "collapsed";
  const selected = url.get("item") || undefined;
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [customizing, setCustomizing] = useState(false);
  const layout = useColumnLayout(DEFAULT_COLUMNS, COLUMN_META.map((c) => c.key));
  const q = useItemsList({ page, per_page: perPage, filter_by: filter, sort_column: sort, sort_order: order });
  const columns = useMemo(() => buildColumns(layout.selected, { quantity: formatQuantity }, layout.widths), [layout.selected, layout.widths, formatQuantity]);
  const soon = () => toast.info("This action is built in a later phase.");
  const { act } = useItemMutations();
  const goNew = () => router.push("/items/new");

  const pick = (id: string): MenuItem => ({ id, label: filterLabel(id), checked: id === filter, onSelect: () => url.set({ filter: id, page: undefined, item: undefined }) });
  /** "Active" -> "Active Items"; labels that already say what they list ("Inventory Items", "Revenue Funds") stay as they are. */
  const titleText = /items$|funds$/i.test(filterLabel(filter)) ? filterLabel(filter) : `${filterLabel(filter)} Items`;
  const titleWith = (size: string) => (
    <DropdownMenu searchable width={345} triggerLabel="Choose a list view"
      trigger={<span className={`flex items-center gap-2 rounded-md px-2 py-1 ${size} font-medium hover:bg-soft`}>{titleText}<ChevronDown size={16} /></span>}
      groups={[{ label: "DEFAULT FILTERS", count: 19, collapsible: true, items: DEFAULT_FILTERS.map((f) => pick(f.id)) }, { label: "CREATED BY ME", count: 5, collapsible: true, items: FUND_FILTERS.map((f) => pick(f.id)) }]}
      footer={{ id: "new-view", label: "New View", icon: <Plus size={14} />, onSelect: soon }} />
  );
  const title = titleWith("text-[1.25rem]");

  /** One definition of the list's More menu, used by the full list and the split view. */
  const moreGroups: MenuGroup[] = [
    { label: "SORT BY", items: [["name", "Name"], ["sku", "SKU"], ["rate", "Rate"], ["stock_on_hand", "Stock On Hand"], ["created_time", "Created Time"]].map(([k, l]) => ({ id: `sort-${k}`, label: l ?? "", checked: sort === k, onSelect: () => url.set({ sort: k, order: "A", page: undefined }) })) },
    { divider: true, items: [{ id: "import", label: "Import", icon: <Upload size={14} />, onSelect: soon }, { id: "export", label: "Export", icon: <Download size={14} />, onSelect: soon }] },
    { divider: true, items: [{ id: "prefs", label: "Preferences", icon: <Settings size={14} />, onSelect: () => router.push("/setup/items") }] },
    { divider: true, items: [{ id: "refresh", label: "Refresh List", icon: <RefreshCw size={14} />, onSelect: () => q.refetch() }, { id: "reset", label: "Reset Column Width", icon: <RotateCcw size={14} />, onSelect: () => layout.reset() }] },
  ];
  const toggleAll = () => setSelection(selection.size === (q.data?.rows.length ?? 0) ? new Set() : new Set((q.data?.rows ?? []).map((r) => r.id)));
  /** Mark as Active / Inactive run for every selected item; the other bulk actions are built later. */
  const bulkAction = async (name: string) => {
    const action = name === "Mark as Active" ? "active" : name === "Mark as Inactive" ? "inactive" : null;
    if (!action) return soon();
    for (const id of selection) await act.mutateAsync({ id, action }).catch(() => undefined);
    setSelection(new Set());
  };
  const bulk = (variant: "bar" | "menu") => <BulkBar variant={variant} count={selection.size} total={q.data?.rows.length ?? 0} onToggleAll={toggleAll} onClear={() => setSelection(new Set())} onAction={bulkAction} />;

  const state = q.isPending ? "loading" : q.isError ? "error" : q.data && q.data.rows.length === 0 ? "empty" : "ready";
  const rows = q.data?.rows ?? [];
  const emptyText = filter === "All" ? "No items yet" : `There are no ${filterLabel(filter).toLowerCase().replace(" items", "")} items.`;
  const empty = <EmptyState title={emptyText} text={filter === "All" ? "Add the products and services you buy and sell." : undefined}
    actions={filter === "All" ? <><Button variant="primary" onClick={goNew}>New Item</Button><Button onClick={soon}>Import</Button></> : undefined} />;

  const actions = (
    <>
      <DropdownMenu align="right" triggerLabel="View" trigger={<span className="inline-flex items-center gap-1 rounded border border-line bg-panel px-2.5 py-1"><Rows3 size={14} /><ChevronDown size={12} /></span>}
        groups={[{ items: [{ id: "exp", label: "Expanded View", checked: !collapsedView, onSelect: () => url.set({ view: undefined }) }, { id: "col", label: "Collapsed View", checked: collapsedView, onSelect: () => url.set({ view: "collapsed" }) }] }]} />
      <span className="flex overflow-hidden rounded border border-line">
        {([["list", List, "List View"], ["grid", LayoutGrid, "Grid View"]] as const).map(([m, Icon, label]) => (
          <button key={m} type="button" aria-label={label} aria-pressed={mode === m} onClick={() => url.set({ mode: m === "list" ? undefined : m })} className={`cursor-pointer border-0 px-2.5 py-1.5 ${mode === m ? "bg-primary text-primary-fg" : "bg-panel"}`}><Icon size={14} /></button>
        ))}
      </span>
      <Button variant="primary" onClick={goNew}><Plus size={14} className="inline" /> New</Button>
      <DropdownMenu align="right" triggerLabel="More Actions" trigger={<span className="inline-flex rounded border border-line bg-panel px-2 py-1"><MoreHorizontal size={16} /></span>}
        groups={moreGroups} />
    </>
  );

  const footer = <Pager page={page} perPage={perPage} total={q.data?.total} hasMore={!!q.data?.hasMore} onChange={(p) => url.set({ page: p.page === 1 ? undefined : String(p.page), per: String(p.perPage) })} />;

  if (selected) {
    const splitMore = <DropdownMenu align="right" triggerLabel="More Actions" trigger={<span className="inline-flex rounded border border-line bg-panel px-2 py-1"><MoreHorizontal size={16} /></span>} groups={moreGroups} />;
    const toggle = (id: string) => setSelection((s0) => { const n = new Set(s0); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    return (
      <MasterDetail mode="split" hideClose onCloseDetail={() => url.set({ item: undefined, tab: undefined })} title={titleWith("text-[1.125rem]")}
        actions={<><Button variant="primary" aria-label="New item" onClick={goNew}><Plus size={14} /></Button>{splitMore}</>}
        list={<>
          {selection.size > 0 && bulk("menu")}
          {state === "ready" ? rows.map((r) => <ListRow key={r.id} on={r.id === selected} onSelect={() => url.set({ item: r.id, tab: undefined })}
            leading={<input type="checkbox" aria-label={`Select ${r.name}`} checked={selection.has(r.id)} onChange={() => toggle(r.id)} className="size-4" />}
            top={<span className="flex gap-2"><span className="flex-1">{r.name}</span><span>{formatMoney(r.sellingPrice)}</span></span>} sub={r.sku ? `SKU: ${r.sku}` : undefined} />)
            : <div className="p-4 text-mute">{state === "loading" ? "Loading..." : state === "error" ? "Could not load items." : "No items."}</div>}
          {footer}
        </>}
        detail={<ItemDetail id={selected} onClose={() => url.set({ item: undefined, tab: undefined })} />} />
    );
  }

  const header = selection.size > 0 ? bulk("bar") : <div className="flex flex-wrap items-center gap-2 py-3 pl-2 pr-5">{title}<span className="flex-1" />{actions}</div>;

  if (collapsedView) {
    return (
      <div className="flex min-w-0 flex-1 flex-col bg-panel">{header}
        <DataTable<never> columns={[{ key: "n", label: "Name", render: () => null }, { key: "s", label: "SKU", render: () => null }, { key: "o", label: "Stock On Hand", align: "right", render: () => null }, { key: "r", label: "Reorder Point", align: "right", render: () => null }]}
          rows={[]} rowKey={() => ""} state="empty" wrap={false} onRetry={() => {}} emptyState={<EmptyState title="No Records Found" />} page={{ page: 1, perPage: 25, hasMore: false, onChange: () => {} }} />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-panel">
      {header}
      {mode === "grid" && state === "ready" ? (
        <>
          <div className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(220px,1fr))] content-start gap-3 overflow-auto p-4">
            {rows.map((r) => (
              <button key={r.id} type="button" onClick={() => url.set({ item: r.id })} className="cursor-pointer border-0 bg-transparent p-0 text-left">
                <Card hoverable title={r.name}><dl className="m-0 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 p-2 text-[0.8125rem]">
                  <dt className="text-mute">SKU</dt><dd className="m-0">{r.sku || "-"}</dd>
                  <dt className="text-mute">Stock in Hand</dt><dd className="m-0">{r.stockOnHand == null ? "-" : `${formatQuantity(r.stockOnHand)} ${r.unit}`}</dd>
                  <dt className="text-mute">Selling Price</dt><dd className="m-0">{formatMoney(r.sellingPrice)}</dd>
                  <dt className="text-mute">Cost Price</dt><dd className="m-0">{formatMoney(r.costPrice)}</dd>
                </dl></Card>
              </button>
            ))}
          </div>
          {footer}
        </>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} state={state} wrap={layout.wrap} onWrapChange={layout.setWrap} widths={layout.widths} onWidthChange={layout.setWidth}
          onCustomizeColumns={() => setCustomizing(true)} onRetry={() => q.refetch()} errorMessage={q.error?.message}
          selection={{ ids: selection, onChange: setSelection }} sort={{ key: sort, dir: order === "A" ? "asc" : "desc", onChange: (s) => url.set({ sort: s.key, order: s.dir === "asc" ? "A" : "D", page: undefined }) }}
          page={{ page, perPage, total: q.data?.total, hasMore: !!q.data?.hasMore, onChange: (p) => url.set({ page: p.page === 1 ? undefined : String(p.page), per: String(p.perPage) }) }}
          onRowOpen={(r) => url.set({ item: r.id })} emptyState={empty} />
      )}
      {customizing && <ColumnCustomizer columns={layout.order.map((k) => COLUMN_META.find((c) => c.key === k)).filter((c) => !!c)} selected={layout.selected}
        onClose={() => setCustomizing(false)} onSave={(order, sel) => { layout.save(order, sel); setCustomizing(false); }} />}
    </div>
  );
}
