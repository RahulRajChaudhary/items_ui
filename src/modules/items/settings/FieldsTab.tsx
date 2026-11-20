"use client";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { DataTable } from "@/shared/ui/DataTable";
import { DropdownMenu, type MenuItem } from "@/shared/ui/DropdownMenu";
import { Modal } from "@/shared/ui/Modal";
import type { RecordAction, RecordDto } from "../api/resources";
import { ConfigForm } from "../features/records/ConfigForm";
import { useRecordMutations, useRecords } from "../features/records/hooks";
import type { SectionDef } from "../features/records/types";
import { FIELD_REMAINING, FIELD_TYPES, ROLES } from "./settingsLists";

const TEXT_TYPES = ["Text Box (Single Line)", "Email", "URL", "Phone", "Text Box (Multi-line)"];
const PRIVACY_TYPES = [...TEXT_TYPES, "Number", "Decimal", "Date"];
const MAX_FIELDS = 135;

const FIELD_SECTIONS: SectionDef[] = [
  { fields: [
    { key: "name", label: "Label Name", kind: "text", required: true, max: 100 },
    { key: "data_type", label: "Data Type", kind: "select", options: FIELD_TYPES, required: true, hint: `Fields you can still create: ${Object.entries(FIELD_REMAINING).map(([k, v]) => `${k} ${v}`).join(", ")}` },
    { key: "help_text", label: "Help Text", kind: "text", max: 100 },
    { key: "privacy", label: "Data Privacy", kind: "radio", options: ["None", "PII", "ePHI"], showIf: (v) => PRIVACY_TYPES.includes(String(v.data_type)) },
    { key: "prevent_duplicates", label: "Prevent Duplicate Values", kind: "switch", hint: "Do not allow the same value twice", showIf: (v) => TEXT_TYPES.includes(String(v.data_type)) },
    { key: "input_format", label: "Input Format", kind: "text", showIf: (v) => TEXT_TYPES.includes(String(v.data_type)) },
    { key: "default_value", label: "Default Value", kind: "text", showIf: (v) => !["Check Box", "Attachment", "Formula", "Image", ""].includes(String(v.data_type)) },
    { key: "options", label: "Dropdown Options (one per line)", kind: "textarea", required: true, showIf: (v) => ["Dropdown", "Multi-select"].includes(String(v.data_type)) },
    { key: "file_type", label: "File Type", kind: "select", options: ["Any file", "Images", "Documents"], showIf: (v) => v.data_type === "Attachment" },
    { key: "mandatory", label: "Is Mandatory", kind: "switch", hint: "Required when creating an item" },
    { key: "show_in_transactions", label: "Show when creating transactions", kind: "switch", hint: "Show this field on transactions" },
  ] },
];

/** Which row-menu actions a field offers, by its `menu` kind (from the live ERP). */
function actionsFor(f: RecordDto, run: (a: RecordAction) => void, edit: () => void, access: () => void, del: () => void): MenuItem[] {
  const on = f.status === "active";
  const inactive: MenuItem = { id: "inactive", label: on ? "Mark as Inactive" : "Mark as Active", onSelect: () => run(on ? "inactive" : "active") };
  const pdf: MenuItem = { id: "pdf", label: f.show_in_pdf ? "Hide in All PDFs" : "Show in All PDFs", onSelect: () => run(f.show_in_pdf ? "hidepdf" : "showpdf") };
  const mand: MenuItem = { id: "mand", label: f.mandatory ? "Mark As Optional" : "Mark As Mandatory", onSelect: () => run(f.mandatory ? "optional" : "mandatory") };
  const acc: MenuItem = { id: "access", label: "Configure Access", onSelect: access };
  const editItem: MenuItem = { id: "edit", label: "Edit", onSelect: edit };
  switch (f.menu) {
    case "cus": return [editItem, inactive, mand, acc];
    case "sku": return [inactive, pdf, mand, acc];
    case "std3": return [inactive, mand, acc];
    case "cfg": return [acc];
    case "inact": return [inactive];
    case "img": return [inactive, pdf];
    case "mrp": return [inactive, mand];
    case "none": return [];
    default: return [editItem, inactive, mand, { id: "delete", label: "Delete", danger: true, onSelect: del }];
  }
}

/** Dialog "Read / Write Access for [field]": for each of the 23 roles, Read and Write, Read Only or Hide Field. */
function AccessModal({ field, onClose }: { field: RecordDto; onClose: () => void }) {
  const { update } = useRecordMutations("fields");
  const [access, setAccess] = useState<Record<string, string>>((field.access as Record<string, string> | undefined) ?? {});
  const save = () => update.mutate({ id: field.id, body: { ...field, access } }, { onSuccess: () => { toast.success("Access has been saved."); onClose(); }, onError: (e) => toast.error(e.message) });
  return (
    <Modal title={`Read / Write Access for ${String(field.name)}`} open onClose={onClose} size="lg" footer={<><Button variant="primary" disabled={update.isPending} onClick={save}>Save</Button><Button onClick={onClose}>Cancel</Button></>}>
      <div className="max-h-[22rem] overflow-auto">
        <table className="w-full border-collapse"><thead><tr>{["ROLE", "READ AND WRITE", "READ ONLY", "HIDE FIELD"].map((h) => <th key={h} className="sticky top-0 border-b border-line bg-soft px-3 py-2 text-left text-[0.75rem] font-medium text-mute">{h}</th>)}</tr></thead>
          <tbody>{ROLES.map((role) => (
            <tr key={role}><td className="border-b border-line px-3 py-2">{role}</td>
              {([["rw", "Read and Write"], ["ro", "Read Only"], ["hide", "Hide Field"]] as const).map(([v, l]) => (
                <td key={v} className="border-b border-line px-3 py-2"><input type="radio" name={`acc-${role}`} aria-label={`${role}: ${l}`} checked={(access[role] ?? "rw") === v} onChange={() => setAccess({ ...access, [role]: v })} /></td>
              ))}</tr>
          ))}</tbody></table>
      </div>
      <p className="m-0 text-[0.75rem] text-mute">Users with a role set to Hide Field cannot see this field on items.</p>
    </Modal>
  );
}

/**
 * Items settings > Fields: the usage counter, the field table with its per-field row menus, the Configure Access dialog
 * (23 roles) and the New Field / Edit page whose inputs change with the data type. Status and mandatory choices are read by the
 * item form, and the SKU-mandatory switch is what allows duplicate item names. Must not draw the item form itself.
 */
export function FieldsTab() {
  const q = useRecords("fields");
  const { create, update, remove, action } = useRecordMutations("fields");
  const [mode, setMode] = useState<{ kind: "list" } | { kind: "form"; record?: RecordDto }>({ kind: "list" });
  const [access, setAccess] = useState<RecordDto>();
  const [del, setDel] = useState<RecordDto>();
  const rows = q.data?.records ?? [];
  const used = rows.filter((f) => f.std !== true || f.name === "Fund Type").length;

  const save = async (body: Record<string, unknown>) => {
    if (mode.kind !== "form") return;
    const rec = mode.record;
    if (!rec && used >= MAX_FIELDS) throw new Error("You have reached the limit of custom fields.");
    const full = rec ? { ...rec, ...body } : { ...body, std: false, menu: "created", show_in_pdf: false, access: {} };
    const res = rec ? await update.mutateAsync({ id: rec.id, body: full }) : await create.mutateAsync(full);
    toast.success(res.message);
    setMode({ kind: "list" });
  };

  if (mode.kind === "form") return <div className="flex min-h-0 flex-1 flex-col"><ConfigForm title={mode.record ? "Edit Field" : "New Field - Items"} sections={FIELD_SECTIONS} record={mode.record} onSubmit={save} onCancel={() => setMode({ kind: "list" })} /></div>;

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
        <span className="text-mute">Custom Fields Usage: {used}/{MAX_FIELDS}</span><span className="flex-1" />
        <Button variant="primary" onClick={() => setMode({ kind: "form" })}>+ New Field</Button>
      </div>
      <DataTable hideFooter wrap state={q.isPending ? "loading" : q.isError ? "error" : "ready"} rows={rows} rowKey={(f) => f.id} errorMessage={q.error?.message} onRetry={() => q.refetch()} emptyState={null} page={{ page: 1, perPage: 200, hasMore: false, onChange: () => {} }}
        columns={[
          { key: "n", label: "Field Name", render: (f) => String(f.name) },
          { key: "t", label: "Data Type", render: (f) => String(f.data_type) },
          { key: "m", label: "Mandatory", render: (f) => (f.mandatory ? "Yes" : "No") },
          { key: "p", label: "Show In All PDFs", render: (f) => (f.show_in_pdf ? "Yes" : "No") },
          { key: "s", label: "Status", render: (f) => <Badge tone={f.status === "active" ? "success" : "neutral"}>{f.status === "active" ? "Active" : "Inactive"}</Badge> },
          { key: "a", label: "More Actions", align: "right", render: (f) => {
            const items = actionsFor(f, (a) => action.mutate({ id: f.id, action: a }), () => setMode({ kind: "form", record: f }), () => setAccess(f), () => setDel(f));
            return items.length ? <DropdownMenu align="right" triggerLabel={`Actions for ${String(f.name)}`} trigger={<MoreHorizontal size={16} />} groups={[{ items }]} /> : null;
          } },
        ]} />
      {access && <AccessModal field={access} onClose={() => setAccess(undefined)} />}
      <Modal title="Delete field?" open={!!del} onClose={() => setDel(undefined)} size="sm" footer={<><Button variant="danger" onClick={() => del && remove.mutate(del.id, { onSuccess: () => setDel(undefined) })}>Delete</Button><Button onClick={() => setDel(undefined)}>Cancel</Button></>}>
        &quot;{del ? String(del.name) : ""}&quot; will be deleted from every item. This cannot be undone.
      </Modal>
    </div>
  );
}
