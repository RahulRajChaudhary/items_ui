import type { ReactNode } from "react";
import { Card } from "./Card";

/**
 * Detail header: the shared Card (panel variant) plus an optional colored status ribbon, a title row and actions.
 * `status` is the ribbon text; `ribbonClass` is a token background class (bg-ok, bg-mute). Must not fetch.
 */
export function DetailCard({ title, status, ribbonClass = "bg-ok", actions, children }: { title: ReactNode; status?: string; ribbonClass?: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <Card variant="panel" className="relative m-5 border border-line !p-0">
      {status && <span className={`absolute -top-px left-6 rounded-b px-3 py-0.5 text-[0.75rem] font-semibold text-white ${ribbonClass}`}>{status}</span>}
      <div className="flex items-center gap-2.5 px-5 pb-2 pt-6">
        <h2 className="m-0 flex-1 text-[1.25rem] font-medium">{title}</h2>
        {actions}
      </div>
      {children && <div className="px-5 pb-4">{children}</div>}
    </Card>
  );
}

/** Two-column label / value list. `rows` are label and value pairs; empty values show "-". Must not format values. */
export function KeyValueGrid({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="m-0 grid grid-cols-[170px_1fr] gap-x-2.5 gap-y-1.5 text-[0.8125rem]">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-mute">{r.label}</dt>
          <dd className="m-0">{r.value || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}
