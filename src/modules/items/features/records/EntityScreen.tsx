"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, MoreHorizontal, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/Badge";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { KeyValueGrid } from "@/shared/ui/DetailCard";
import { DropdownMenu } from "@/shared/ui/DropdownMenu";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ListRow, MasterDetail } from "@/shared/ui/MasterDetail";
import { Modal } from "@/shared/ui/Modal";
import { Tabs } from "@/shared/ui/Tabs";
import { formatMoney } from "@/shared/lib/format";
import { useUrlState } from "@/shared/hooks/useUrlState";
import type { RecordDto } from "../../api/resources";
import { ConfigForm } from "./ConfigForm";
import { useRecord, useRecordMutations, useRecords } from "./hooks";
import type { ColumnDef, DetailTab, EntityConfig } from "./types";

const soon = () => toast.info("This action is built in a later phase.");
const show = (v: unknown, money?: boolean): ReactNode => (v === undefined || v === null || v === "" ? "-" : money ? formatMoney(Number(v)) : String(v));
const rowsOf = (r: RecordDto, key: string): Record<string, unknown>[] => (Array.isArray(r[key]) ? (r[key] as Record<string, unknown>[]) : []);

function toColumns(cols: ColumnDef[]): Column<RecordDto>[] {
  return cols.map((c) => ({
    key: c.key, label: c.label, align: c.align,
    render: (r: RecordDto) => {
      if (!c.badge) return show(r[c.key], c.money);
      const on = r[c.key] === "active" || r[c.key] === "Active";
      return <Badge tone={on ? "success" : "neutral"}>{on ? "Active" : "Inactive"}</Badge>;
    },
  }));
}

/** Status shown as a word (Active / Inactive) wherever a list or detail needs it. */
const statusLabel = (r: RecordDto) => (r.status === "active" ? "Active" : "Inactive");

function DetailBody({ cfg, r, tab }: { cfg: EntityConfig; r: RecordDto; tab: DetailTab }) {
  if (tab.kind === "fields") return <div className="p-5"><KeyValueGrid rows={tab.fields.map((f) => ({ label: f.label, value: show(r[f.key], f.money) }))} /></div>;
  if (tab.kind === "rows") {
    const rows = rowsOf(r, tab.rowsKey);
    return <div className="p-5"><DataTable hideFooter wrap state={rows.length ? "ready" : "empty"} rows={rows} rowKey={(x) => JSON.stringify(x)} onRetry={() => {}} page={{ page: 1, perPage: 25, hasMore: false, onChange: () => {} }}
      emptyState={<EmptyState title={tab.empty} />} columns={toColumns(tab.columns) as unknown as Column<Record<string, unknown>>[]} /></div>;
  }
  if (tab.kind === "activity") return <div className="p-5"><DataTable hideFooter wrap state="ready" rows={[{ id: "c", date: new Date(r.created_time).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }), details: `${cfg.singular} created` }]} rowKey={(x) => x.id}
    onRetry={() => {}} page={{ page: 1, perPage: 25, hasMore: false, onChange: () => {} }} emptyState={null} columns={[{ key: "date", label: "Date", render: (x) => x.date }, { key: "details", label: "Details", render: (x) => x.details }]} /></div>;
  return <EmptyState title={tab.title} text={tab.text} actions={tab.actions?.map((a, i) => <Button key={a} variant={i === 0 ? "primary" : "default"} onClick={soon}>{a}</Button>)} />;
}

/** Right pane: ribbon header with Edit, status and Delete, a summary strip and the entity's tabs (with counts for table tabs). */
function Detail({ cfg, id, onClose }: { cfg: EntityConfig; id: string; onClose: () => void }) {
  const router = useRouter();
  const url = useUrlState();
  const q = useRecord(cfg.resource, id);
  const { remove, action } = useRecordMutations(cfg.resource);
  const [confirm, setConfirm] = useState(false);
  if (q.isLoading) return <div className="m-5 h-40 animate-pulse rounded-[10px] bg-soft" aria-busy="true" />;
  if (q.isError || !q.data) return <div className="m-5"><Banner tone="error">{q.error?.message ?? "Could not load this record."} <Button compact onClick={() => q.refetch()}>Retry</Button></Banner></div>;
  const r = q.data;
  const active = url.get("tab", cfg.tabs[0]?.id ?? "");
  const tab = cfg.tabs.find((t) => t.id === active) ?? cfg.tabs[0];
  const tabList = cfg.tabs.map((t) => ({ id: t.id, label: t.label, count: t.kind === "rows" && t.counted ? rowsOf(r, t.rowsKey).length : undefined }));
  return (
    <div className="flex min-h-0 flex-col">
      <div className="relative m-5 mb-0 rounded-t-[10px] border border-b-0 border-line bg-panel">
        <span className={`absolute -top-px left-6 rounded-b px-3 py-0.5 text-[0.75rem] font-semibold text-white ${r.status === "active" ? "bg-ok" : "bg-mute"}`}>{statusLabel(r)}</span>
        <div className="flex flex-wrap items-center gap-2 px-5 pb-3 pt-7">
          <h2 className="m-0 mr-auto text-[1.375rem] font-medium">{cfg.headline ? cfg.headline(r) : String(r.name)}</h2>
          <Button aria-label={`Edit ${cfg.singular}`} onClick={() => router.push(`/items/${cfg.slug}/edit/${id}`)}><Pencil size={14} /></Button>
          {cfg.headerActions?.map((a) => <Button key={a} onClick={soon}>{a}</Button>)}
          <DropdownMenu align="right" triggerLabel="More actions" trigger={<span className="inline-flex items-center gap-1.5 rounded border border-line bg-panel px-3 py-[5px]">More <ChevronDown size={13} /></span>}
            groups={[{ items: [{ id: "toggle", label: r.status === "active" ? "Mark as Inactive" : "Mark as Active", onSelect: () => action.mutate({ id, action: r.status === "active" ? "inactive" : "active" }) }, { id: "delete", label: "Delete", danger: true, onSelect: () => setConfirm(true) }] }]} />
          <button type="button" aria-label="Close" onClick={onClose} className="cursor-pointer border-0 bg-transparent p-1.5 text-mute hover:text-ink"><X size={18} /></button>
        </div>
        {cfg.summary && <div className="px-5 pb-4"><KeyValueGrid rows={cfg.summary.map((f) => ({ label: f.label, value: show(r[f.key], f.money) }))} /></div>}
      </div>
      <div className="mx-5 rounded-b-[10px] border border-line bg-panel">
        <Tabs tabs={tabList} activeId={tab?.id ?? ""} onChange={(t) => url.set({ tab: t === cfg.tabs[0]?.id ? undefined : t })} label={`${cfg.singular} sections`} />
        {tab && <DetailBody cfg={cfg} r={r} tab={tab} />}
      </div>
      <Modal title={`Delete ${cfg.singular}?`} open={confirm} onClose={() => setConfirm(false)} size="sm" footer={<><Button variant="danger" disabled={remove.isPending} onClick={() => remove.mutate(id, { onSuccess: () => { setConfirm(false); onClose(); } })}>Delete</Button><Button onClick={() => setConfirm(false)}>Cancel</Button></>}>
        {cfg.deleteText ? cfg.deleteText(r) : `This ${cfg.singular.toLowerCase()} will be deleted. This cannot be undone.`}
      </Modal>
    </div>
  );
}

/** Simple price-list lifecycle picture used by the Price Lists empty state: four steps with arrows. */
function Lifecycle() {
  const steps = ["Create Price List", "Sales or Purchase price list", "All Items or Individual Items", "Invoice or Bill"];
  return <div aria-label="Life cycle of Price Lists" className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-center gap-3 text-[0.75rem]">{steps.map((s, i) => <span key={s} className="flex items-center gap-3"><span className="rounded-md border border-line bg-panel px-3 py-2">{s}</span>{i < steps.length - 1 && <span aria-hidden>→</span>}</span>)}</div>;
}

/**
 * One screen for every module tab, drawn from an EntityConfig: title filter menu, list, empty/loading/error states,
 * split detail or table row actions, and New. New and Edit open the generated form at /items/<slug>/new and /edit/<id>.
 * Filter, page and the open record live in the URL. Must not know which entity it is showing.
 */
export function EntityScreen({ cfg }: { cfg: EntityConfig }) {
  const router = useRouter();
  const url = useUrlState();
  const filter = url.get("filter", cfg.defaultFilter);
  const selected = url.get("record") || undefined;
  const q = useRecords(cfg.resource, { filter_by: filter, sort_column: "name", sort_order: "A" });
  const { action, remove } = useRecordMutations(cfg.resource);
  const [del, setDel] = useState<RecordDto>();
  const rows = q.data?.records ?? [];
  const state = q.isPending ? "loading" : q.isError ? "error" : rows.length === 0 ? "empty" : "ready";
  const filterName = cfg.filters.find((f) => f.id === filter)?.label ?? filter;
  const title = (size: string) => (
    <DropdownMenu searchable width={300} triggerLabel="Choose a list view" trigger={<span className={`flex items-center gap-2 rounded-md px-2 py-1 font-medium hover:bg-soft ${size}`}>{filterName}<ChevronDown size={16} /></span>}
      groups={[{ label: "DEFAULT FILTERS", count: cfg.filters.length, collapsible: true, items: cfg.filters.map((f) => ({ id: f.id, label: f.label, checked: f.id === filter, onSelect: () => url.set({ filter: f.id, record: undefined }) })) }]}
      footer={{ id: "view", label: "New View", icon: <Plus size={14} />, onSelect: soon }} />
  );
  const goNew = () => router.push(`/items/${cfg.slug}/new`);
  const moreMenu = (
    <DropdownMenu align="right" triggerLabel="More Actions" trigger={<span className="inline-flex rounded border border-line bg-panel px-2 py-1"><MoreHorizontal size={16} /></span>}
      groups={[{ items: [{ id: "import", label: "Import", onSelect: soon }, { id: "export", label: "Export", onSelect: soon }, { id: "refresh", label: "Refresh List", onSelect: () => q.refetch() }] }]} />
  );
  const empty = <EmptyState title={filter === cfg.defaultFilter || filter === "All" ? cfg.empty.title : `No ${filterName.toLowerCase()} records.`} text={filter === "All" || filter === cfg.defaultFilter ? cfg.empty.text : undefined}
    illustration={cfg.empty.diagram ? <Lifecycle /> : undefined} actions={filter === "All" || filter === cfg.defaultFilter ? <>{cfg.empty.actions?.map((a, i) => <Button key={a} variant={i === 0 ? "primary" : "default"} onClick={i === 0 ? goNew : soon}>{a}</Button>)}</> : undefined} />;

  const sibling = cfg.sibling && <Link href={`/items/${cfg.sibling.slug}`} className="text-link hover:underline">{cfg.sibling.label}</Link>;

  if (selected && cfg.layout === "split") {
    return (
      <MasterDetail mode="split" hideClose onCloseDetail={() => url.set({ record: undefined, tab: undefined })} title={title("text-[1.125rem]")}
        actions={<><Button variant="primary" aria-label={`New ${cfg.singular}`} onClick={goNew}><Plus size={14} /></Button>{moreMenu}</>}
        list={state === "ready" ? rows.map((r) => <ListRow key={r.id} on={r.id === selected} onSelect={() => url.set({ record: r.id, tab: undefined })} top={cfg.rowTitle(r)} sub={cfg.rowSub?.(r)} badge={r.status === "inactive" ? <Badge>Inactive</Badge> : undefined} />) : <div className="p-4 text-mute">{state === "loading" ? "Loading..." : state === "error" ? "Could not load the list." : "No records."}</div>}
        detail={<Detail cfg={cfg} id={selected} onClose={() => url.set({ record: undefined, tab: undefined })} />} />
    );
  }

  const columns = toColumns(cfg.columns);
  const actionsCol: Column<RecordDto> | null = cfg.layout === "table" ? { key: "actions", label: "Actions", align: "right", render: (r) => (
    <DropdownMenu align="right" triggerLabel={`Actions for ${String(r.name)}`} trigger={<MoreHorizontal size={16} />} groups={[{ items: [
      { id: "edit", label: "Edit", onSelect: () => router.push(`/items/${cfg.slug}/edit/${r.id}`) },
      { id: "toggle", label: r.status === "active" ? "Mark as Inactive" : "Mark as Active", onSelect: () => action.mutate({ id: r.id, action: r.status === "active" ? "inactive" : "active" }) },
      { id: "delete", label: "Delete", danger: true, onSelect: () => setDel(r) },
    ] }]} />
  ) } : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-panel">
      <div className="flex flex-wrap items-center gap-2 py-3 pl-2 pr-5">{title("text-[1.25rem]")}{sibling && <span className="ml-3">{sibling}</span>}<span className="flex-1" />{moreMenu}<Button variant="primary" onClick={goNew}><Plus size={14} className="inline" /> New</Button></div>
      <DataTable columns={actionsCol ? [...columns, actionsCol] : columns} rows={rows} rowKey={(r) => r.id} state={state} wrap onRetry={() => q.refetch()} errorMessage={q.error?.message}
        page={{ page: 1, perPage: 200, total: q.data?.page.total, hasMore: false, onChange: () => {} }} hideFooter={rows.length < 25}
        onRowOpen={cfg.layout === "split" ? (r) => url.set({ record: r.id }) : undefined} emptyState={empty} />
      <Modal title={`Delete ${cfg.singular}?`} open={!!del} onClose={() => setDel(undefined)} size="sm" footer={<><Button variant="danger" onClick={() => del && remove.mutate(del.id, { onSuccess: () => setDel(undefined) })}>Delete</Button><Button onClick={() => setDel(undefined)}>Cancel</Button></>}>
        {del && (cfg.deleteText ? cfg.deleteText(del) : `"${String(del.name)}" will be deleted. This cannot be undone.`)}
      </Modal>
    </div>
  );
}

/** New / Edit page of an entity: the generated form, a success toast and a return to the list (or the new record). */
export function EntityForm({ cfg, id }: { cfg: EntityConfig; id?: string }) {
  const router = useRouter();
  const products = useRecords("products");
  const productNames = (products.data?.records ?? []).map((p) => String(p.name));
  const sections = cfg.sections.map((s) => ({ ...s, fields: s.fields.map((fd) => (fd.optionsFrom === "products" ? { ...fd, options: productNames } : fd)) }));
  const rec = useRecord(cfg.resource, id);
  const { create, update } = useRecordMutations(cfg.resource);
  const back = (rid?: string) => router.push(rid && cfg.layout === "split" ? `/items/${cfg.slug}?record=${rid}` : `/items/${cfg.slug}`);
  const onSubmit = async (raw: Record<string, unknown>) => {
    const body = cfg.derive ? cfg.derive(raw) : raw;
    const res = id ? await update.mutateAsync({ id, body }) : await create.mutateAsync(body);
    toast.success(res.message);
    if (!id && cfg.afterCreate) return router.push(cfg.afterCreate(res.record.id));
    back(res.record.id);
  };
  if (id && rec.isPending) return <div className="flex-1 bg-panel p-6" aria-busy="true"><div className="h-8 w-48 animate-pulse rounded bg-soft" /></div>;
  if (id && rec.isError) return <div className="p-5"><Banner tone="error">{rec.error.message}</Banner></div>;
  return <ConfigForm title={`${id ? "Edit" : "New"} ${cfg.singular}`} sections={sections} record={rec.data} base={cfg.defaults} variant={cfg.modalForm ? "modal" : "page"} onSubmit={onSubmit} onCancel={() => back()} />;
}
