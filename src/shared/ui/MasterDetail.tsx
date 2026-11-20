import type { ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Left list pane plus right detail pane. `title` and `actions` sit in the left header; `list` is the rows.
 * mode "listOnly" shows only the list full width. `onCloseDetail` is called by the built-in close button, which `hideClose` turns off when the detail draws its own.
 * Must not fetch or know what the rows are.
 */
export function MasterDetail({ title, actions, list, detail, mode, onCloseDetail, hideClose }: { title: ReactNode; actions?: ReactNode; list: ReactNode; detail?: ReactNode; mode: "split" | "listOnly"; onCloseDetail: () => void; hideClose?: boolean }) {
  const split = mode === "split";
  return (
    <div className="flex min-h-0 flex-1">
      <section aria-label="List" className={split ? "w-[340px] flex-none overflow-auto border-r border-line bg-panel" : "min-w-0 flex-1 overflow-auto bg-panel"}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line py-2.5 pl-1 pr-3">
          <div className="text-base font-semibold">{title}</div>
          <span className="flex-1" />
          {actions}
        </div>
        {list}
      </section>
      {split && (
        <section aria-label="Detail" className="relative min-w-0 flex-1 overflow-auto bg-soft">
          {!hideClose && <button type="button" aria-label="Close detail" onClick={onCloseDetail} className="absolute right-3 top-3 z-10 cursor-pointer border-0 bg-transparent text-bad">
            <X size={14} />
          </button>}
          {detail}
        </section>
      )}
    </div>
  );
}

/** One row of the left list. `on` marks the open one; `leading` is an optional checkbox; `top`/`sub` are the two text lines; `badge` is optional right text. */
export function ListRow({ on, onSelect, top, sub, badge, leading }: { on: boolean; onSelect: () => void; top: ReactNode; sub?: ReactNode; badge?: ReactNode; leading?: ReactNode }) {
  return (
    <div className={`flex items-start gap-2.5 border-b border-line px-3 py-2.5 transition-colors hover:bg-soft ${on ? "bg-soft" : ""}`}>
      {leading && <span className="pt-0.5">{leading}</span>}
      <button type="button" aria-current={on ? "true" : undefined} onClick={onSelect} className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 border-0 bg-transparent p-0 text-left text-inherit">
        <span className="min-w-0 flex-1"><span className="block">{top}</span>{sub && <small className="block text-mute">{sub}</small>}</span>
        {badge}
      </button>
    </div>
  );
}
