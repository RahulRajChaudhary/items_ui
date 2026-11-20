"use client";
import { useState } from "react";
import { GripVertical, Lock } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

type Col = { key: string; label: string; locked?: boolean };

/**
 * Modal to choose and reorder table columns. `columns` is every available column in the current order (locked ones
 * cannot be unchecked); `selected` are the visible keys. `onSave` gets the new order and visible keys.
 * Needs at least one column besides the locked one. Must not persist anything itself.
 */
export function ColumnCustomizer({ columns, selected, onSave, onClose }: { columns: Col[]; selected: string[]; onSave: (order: string[], selected: string[]) => void; onClose: () => void }) {
  const [order, setOrder] = useState(columns.map((c) => c.key));
  const [sel, setSel] = useState(selected);
  const [q, setQ] = useState("");
  const [drag, setDrag] = useState<string | null>(null);
  const byKey = new Map(columns.map((c) => [c.key, c]));
  const lockedCount = columns.filter((c) => c.locked).length;
  const move = (over: string) => {
    if (!drag || drag === over || byKey.get(over)?.locked || byKey.get(drag)?.locked) return;
    const next = order.filter((k) => k !== drag);
    next.splice(next.indexOf(over), 0, drag);
    setOrder(next);
  };
  const toggle = (k: string) => setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  const visible = order.filter((k) => byKey.get(k)?.label.toLowerCase().includes(q.toLowerCase()));
  const picked = order.filter((k) => sel.includes(k) || byKey.get(k)?.locked);
  return (
    <Modal title="Customize Columns" open onClose={onClose} footer={<><Button variant="primary" disabled={picked.length <= lockedCount} onClick={() => onSave(order, picked)}>Save</Button><Button onClick={onClose}>Cancel</Button></>}>
      <div className="text-mute">{picked.length} of {columns.length} Selected</div>
      <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search columns" className="w-full rounded border border-line bg-panel px-2 py-1.5 text-[0.7812rem]" />
      <ul className="m-0 max-h-[340px] list-none overflow-auto p-0">
        {visible.map((k) => {
          const c = byKey.get(k);
          if (!c) return null;
          return (
            <li key={k} draggable={!c.locked} onDragStart={() => setDrag(k)} onDragOver={(e) => { e.preventDefault(); move(k); }} onDragEnd={() => setDrag(null)} className="mb-1.5 flex items-center gap-3 rounded bg-soft px-2.5 py-2">
              <GripVertical size={14} className="text-mute" aria-hidden />
              {c.locked ? <Lock size={11} aria-label="Locked" /> : <input type="checkbox" id={`col-${k}`} checked={sel.includes(k)} onChange={() => toggle(k)} />}
              <label htmlFor={`col-${k}`}>{c.label}</label>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
