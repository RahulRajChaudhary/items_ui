"use client";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { DropdownMenu } from "@/shared/ui/DropdownMenu";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal } from "@/shared/ui/Modal";
import type { RecordDto } from "../api/resources";
import { ConfigForm } from "../features/records/ConfigForm";
import { useRecordMutations, useRecords } from "../features/records/hooks";
import type { SettingsList } from "./settingsLists";

const LOCATIONS = ["All", "Details Page Menu", "List Page - Action Menu", "List Page - Bulk Action Menu"];

/**
 * One of the list tabs of Items settings (Validation Rules, Record Locking, Buttons, Related Lists). The list, the empty
 * state and the New/Edit form all come from the `SettingsList` definition. Saving refreshes the Items screens that
 * read these records (lock menu, header buttons, related tabs, save checks). Must not know which tab it is.
 */
export function SettingsListTab({ list }: { list: SettingsList }) {
  const q = useRecords(list.resource);
  const { create, update, remove, action } = useRecordMutations(list.resource);
  const [mode, setMode] = useState<{ kind: "list" } | { kind: "form"; record?: RecordDto }>({ kind: "list" });
  const [del, setDel] = useState<RecordDto>();
  const [loc, setLoc] = useState("All");
  const all = q.data?.records ?? [];
  const rows = list.resource === "buttons" && loc !== "All" ? all.filter((r) => r.location === loc) : all;

  const save = async (body: Record<string, unknown>) => {
    const withWhen = list.resource === "rules" ? { ...body, when: `${String(body.field)} ${String(body.comparator)} ${String(body.value)}` } : body;
    const rec = mode.kind === "form" ? mode.record : undefined;
    const res = rec ? await update.mutateAsync({ id: rec.id, body: withWhen }) : await create.mutateAsync(withWhen);
    toast.success(res.message);
    setMode({ kind: "list" });
  };

  if (mode.kind === "form") {
    return <div className="flex min-h-0 flex-1 flex-col"><ConfigForm title={`${mode.record ? "Edit" : "New"} ${list.singular}`} sections={list.sections} record={mode.record} base={list.defaults} variant={list.variant} onSubmit={save} onCancel={() => setMode({ kind: "list" })} /></div>;
  }

  const columns: Column<RecordDto>[] = [
    ...list.columns.map((c) => ({ key: c.key, label: c.label, render: (r: RecordDto) => (c.badge ? <Badge tone={r.status === "active" ? "success" : "neutral"}>{r.status === "active" ? "Active" : "Inactive"}</Badge> : String(r[c.key] ?? "-")) })),
    { key: "actions", label: "Actions", align: "right", render: (r) => (
      <DropdownMenu align="right" triggerLabel={`Actions for ${String(r.name)}`} trigger={<MoreHorizontal size={16} />} groups={[{ items: [
        { id: "edit", label: "Edit", onSelect: () => setMode({ kind: "form", record: r }) },
        { id: "toggle", label: r.status === "active" ? "Mark as Inactive" : "Mark as Active", onSelect: () => action.mutate({ id: r.id, action: r.status === "active" ? "inactive" : "active" }) },
        { id: "delete", label: "Delete", danger: true, onSelect: () => setDel(r) },
      ] }]} />
    ) },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        {list.resource === "buttons" && (
          <DropdownMenu triggerLabel="Location filter" width={240} trigger={<span className="inline-flex items-center rounded-md border border-line bg-soft px-3 py-2">Location : {loc} ▾</span>} groups={[{ items: LOCATIONS.map((l) => ({ id: l, label: l, checked: l === loc, onSelect: () => setLoc(l) })) }]} />
        )}
        <span className="flex-1" />
        {list.resource === "buttons" && <Button onClick={() => toast.info("Button logs are built in a later phase.")}>View Logs</Button>}
        <Button variant="primary" onClick={() => setMode({ kind: "form" })}>{list.newLabel}</Button>
      </div>
      <DataTable hideFooter wrap state={q.isPending ? "loading" : q.isError ? "error" : rows.length === 0 ? "empty" : "ready"} rows={rows} rowKey={(r) => r.id} columns={columns} errorMessage={q.error?.message} onRetry={() => q.refetch()}
        page={{ page: 1, perPage: 200, hasMore: false, onChange: () => {} }} emptyState={<EmptyState title={list.empty.title ?? ""} text={list.empty.text} />} />
      <Modal title={`Delete ${list.singular}?`} open={!!del} onClose={() => setDel(undefined)} size="sm" footer={<><Button variant="danger" onClick={() => del && remove.mutate(del.id, { onSuccess: () => setDel(undefined) })}>Delete</Button><Button onClick={() => setDel(undefined)}>Cancel</Button></>}>
        &quot;{del ? String(del.name) : ""}&quot; will be deleted. This cannot be undone.
      </Modal>
    </div>
  );
}
