"use client";
import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { ItemsFrame } from "@/modules/items/components/ItemsFrame";
import { Badge } from "@/shared/ui/Badge";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/Button";
import { ColumnCustomizer } from "@/shared/ui/ColumnCustomizer";
import { DataTable, type Column } from "@/shared/ui/DataTable";
import { DetailCard, KeyValueGrid } from "@/shared/ui/DetailCard";
import { DropdownMenu } from "@/shared/ui/DropdownMenu";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Field, controlClass } from "@/shared/ui/Field";
import { FormShell } from "@/shared/ui/FormShell";
import { ListRow, MasterDetail } from "@/shared/ui/MasterDetail";
import { Modal } from "@/shared/ui/Modal";
import { Tabs } from "@/shared/ui/Tabs";

type Row = { id: string; name: string; sku: string; rate: number };
const ROWS: Row[] = [{ id: "1", name: "Sample item one", sku: "SKU-1", rate: 1800 }, { id: "2", name: "Sample item two", sku: "SKU-2", rate: 250 }];
const COLS = [{ key: "name", label: "Name", locked: true }, { key: "sku", label: "SKU" }, { key: "rate", label: "Rate" }];

/** Examples page: every shared component in each state, for review and a11y checks. Not part of the product. */
export default function Examples() {
  const [state, setState] = useState<"loading" | "error" | "empty" | "ready">("ready");
  const [wrap, setWrap] = useState(false);
  const [custom, setCustom] = useState(false);
  const [modal, setModal] = useState(false);
  const [view, setView] = useState<"table" | "split" | "form">("table");
  const [tab, setTab] = useState("a");
  const [vis, setVis] = useState(["name", "sku", "rate"]);
  const all: Column<Row>[] = [
    { key: "name", label: "Name", render: (r) => r.name },
    { key: "sku", label: "SKU", render: (r) => r.sku },
    { key: "rate", label: "Rate", align: "right", sortable: true, render: (r) => r.rate.toLocaleString("en-IN") },
  ];
  const columns = all.filter((c) => vis.includes(c.key));
  return (
    <ItemsFrame activeTab="Items" onTab={() => {}}>
      <div className="flex min-w-0 flex-1 flex-col bg-panel">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-2.5">
          {(["loading", "error", "empty", "ready"] as const).map((s) => <Button key={s} compact onClick={() => setState(s)}>{s}</Button>)}
          <Button compact onClick={() => setView("table")}>table</Button>
          <Button compact onClick={() => setView("split")}>master-detail</Button>
          <Button compact onClick={() => setView("form")}>form</Button>
          <Button compact onClick={() => setModal(true)}>modal</Button>
          <DropdownMenu triggerLabel="More" align="right" trigger={<MoreHorizontal size={16} />} groups={[{ label: "Group", items: [{ id: "a", label: "Import", onSelect: () => {} }, { id: "b", label: "Delete", danger: true, onSelect: () => {} }] }]} />
        </div>
        <div className="flex gap-2 p-3"><Badge tone="success">Active</Badge><Badge tone="danger">Inactive</Badge><Banner tone="info">Info banner</Banner></div>
        {view === "table" && (
          <DataTable columns={columns} rows={state === "ready" ? ROWS : []} rowKey={(r) => r.id} state={state} wrap={wrap} onWrapChange={setWrap}
            onCustomizeColumns={() => setCustom(true)} onRetry={() => setState("ready")} selection={{ ids: new Set(), onChange: () => {} }}
            sort={{ key: "rate", dir: "asc", onChange: () => {} }} page={{ page: 1, perPage: 25, total: ROWS.length, hasMore: false, onChange: () => {} }}
            emptyState={<EmptyState title="No records" text="Nothing to show." actions={<Button variant="primary"><Plus size={14} /> New</Button>} />} />
        )}
        {view === "split" && (
          <MasterDetail mode="split" title="All" onCloseDetail={() => setView("table")} actions={<Button variant="primary" aria-label="New"><Plus size={14} /></Button>}
            list={ROWS.map((r) => <ListRow key={r.id} on={r.id === "1"} onSelect={() => {}} top={r.name} sub={r.sku} />)}
            detail={<><DetailCard title="Sample item one" status="Active" actions={<Button>Edit</Button>}><KeyValueGrid rows={[{ label: "SKU", value: "SKU-1" }, { label: "Rate", value: "" }]} /></DetailCard>
              <Tabs tabs={[{ id: "a", label: "Overview" }, { id: "b", label: "History", count: 2 }]} activeId={tab} onChange={setTab} /></>} />
        )}
        {view === "form" && (
          <FormShell title="New record" submitting={false} dirty={false} onSubmit={() => {}} onCancel={() => setView("table")} error={state === "error" ? "The server sentence appears here." : undefined}>
            <Field label="Name" htmlFor="n" required hint="Up to 100 characters"><input id="n" className={controlClass} /></Field>
            <Field label="SKU" htmlFor="s" error={state === "error" ? "Invalid value" : undefined}><input id="s" className={controlClass} /></Field>
          </FormShell>
        )}
      </div>
      {custom && <ColumnCustomizer columns={COLS} selected={vis} onClose={() => setCustom(false)} onSave={(_o, s) => { setVis(s); setCustom(false); }} />}
      <Modal title="Confirm" open={modal} onClose={() => setModal(false)} footer={<Button variant="primary" onClick={() => setModal(false)}>OK</Button>}>Modal body</Modal>
    </ItemsFrame>
  );
}
