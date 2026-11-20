"use client";
import { useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, SlidersHorizontal } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { DropdownMenu } from "./DropdownMenu";
import { Pager } from "./Pager";

export type Column<T> = { key: string; label: string; align?: "left" | "right"; width?: number; render: (row: T) => ReactNode; sortable?: boolean };

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  state: "loading" | "error" | "empty" | "ready";
  selection?: { ids: Set<string>; onChange: (ids: Set<string>) => void };
  sort?: { key: string; dir: "asc" | "desc"; onChange: (s: { key: string; dir: "asc" | "desc" }) => void };
  page: { page: number; perPage: number; total?: number; hasMore: boolean; onChange: (p: { page: number; perPage: number }) => void };
  wrap: boolean;
  onWrapChange?: (wrap: boolean) => void;
  onCustomizeColumns?: () => void;
  /** Dragged column widths in px by column key, and the callback when a drag ends. Omit both to turn resizing off. */
  widths?: Record<string, number>;
  onWidthChange?: (key: string, width: number) => void;
  onRowOpen?: (row: T) => void;
  onRetry: () => void;
  emptyState: ReactNode;
  errorMessage?: string;
  /** Hide the paging footer (small tables with no paging). */
  hideFooter?: boolean;
};

/** Row height used to window long lists; rows are drawn only for what is on screen once a list passes this many rows. */
const ROW_H = 61;
const WINDOW_AFTER = 60;
const OVERSCAN = 8;

const FIRST_COL = "w-[5.5rem] min-w-[5.5rem]";

/**
 * Config-driven table. `columns` describe cells; `state` picks skeleton / error / empty / data.
 * Sorting and paging are server side: this component only reports changes through callbacks.
 * The sliders menu offers Customize Columns and Clip/Wrap Text; header edges can be dragged to resize.
 * Long lists (over 60 clipped rows) are windowed: only the rows on screen are drawn, so a 200-row page stays fast.
 * Must not fetch or sort rows itself.
 */
export function DataTable<T>(p: Props<T>) {
  const ids = p.rows.map(p.rowKey);
  const lead = !!(p.selection || p.onCustomizeColumns);
  const scroller = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ top: 0, height: 800 });
  /** Windowing: with wrapped text rows have unknown heights, so it only applies to clipped (one line) rows. */
  const windowed = !p.wrap && p.rows.length > WINDOW_AFTER;
  const first = windowed ? Math.max(0, Math.floor(view.top / ROW_H) - OVERSCAN) : 0;
  const last = windowed ? Math.min(p.rows.length, Math.ceil((view.top + view.height) / ROW_H) + OVERSCAN) : p.rows.length;
  const shown = windowed ? p.rows.slice(first, last) : p.rows;
  const sel = p.selection;
  const all = !!sel && ids.length > 0 && ids.every((i) => sel.ids.has(i));
  const align = (c: Column<T>) => (c.align === "right" ? "text-right" : "text-left");
  const wOf = (c: Column<T>) => p.widths?.[c.key] ?? c.width;
  const cellCls = (c: Column<T>) => (p.wrap ? "whitespace-normal break-words" : wOf(c) ? "overflow-hidden text-ellipsis whitespace-nowrap" : "max-w-[14rem] overflow-hidden text-ellipsis whitespace-nowrap");

  const startResize = (e: React.PointerEvent, c: Column<T>) => {
    if (!p.onWidthChange) return;
    e.preventDefault();
    e.stopPropagation();
    const th = (e.currentTarget as HTMLElement).parentElement;
    const startX = e.clientX;
    const startW = th?.getBoundingClientRect().width ?? 120;
    let w = startW;
    const move = (ev: PointerEvent) => {
      w = Math.max(60, Math.round(startW + ev.clientX - startX));
      if (th) th.style.width = `${w}px`;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      p.onWidthChange?.(c.key, w);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scroller} onScroll={(e) => windowed && setView({ top: e.currentTarget.scrollTop, height: e.currentTarget.clientHeight })} className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-[1]">
            <tr>
              {lead && <th className={cn(FIRST_COL, "whitespace-nowrap border-y border-line bg-soft px-4 py-2.5 text-left align-middle")}>
                <span className="flex items-center gap-2.5">
                  <DropdownMenu
                    triggerLabel="Column options"
                    trigger={<SlidersHorizontal size={16} className="text-acc" />}
                    groups={[{ items: [
                      { id: "cols", label: "Customize Columns", onSelect: () => p.onCustomizeColumns?.() },
                      { id: "wrap", label: p.wrap ? "Clip Text" : "Wrap Text", onSelect: () => p.onWrapChange?.(!p.wrap) },
                    ] }]}
                  />
                  {sel && <input type="checkbox" aria-label="Select all" checked={all} onChange={() => sel.onChange(all ? new Set() : new Set(ids))} className="size-4" />}
                </span>
              </th>}
              {p.columns.map((c) => {
                const active = p.sort?.key === c.key;
                const w = wOf(c);
                return (
                  <th key={c.key} aria-sort={active ? (p.sort?.dir === "asc" ? "ascending" : "descending") : undefined} style={w ? { width: w, minWidth: w } : undefined} className={cn("relative whitespace-nowrap border-y border-line bg-soft px-3 py-2.5 align-middle text-[0.75rem] font-medium uppercase text-mute", align(c))}>
                    {c.sortable && p.sort ? (
                      <button type="button" className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 uppercase text-inherit" onClick={() => p.sort?.onChange({ key: c.key, dir: active && p.sort.dir === "asc" ? "desc" : "asc" })}>
                        {c.label}
                        {active && (p.sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                      </button>
                    ) : c.label}
                    {p.onWidthChange && <span role="separator" aria-orientation="vertical" aria-label={`Resize ${c.label}`} onPointerDown={(e) => startResize(e, c)} className="absolute right-0 top-1/4 h-1/2 w-1.5 cursor-col-resize border-r border-line hover:border-mute" />}
                  </th>
                );
              })}
            </tr>
          </thead>
          {p.state === "ready" && (
            <tbody>
              {windowed && first > 0 && <tr aria-hidden style={{ height: first * ROW_H }}><td colSpan={p.columns.length + (lead ? 1 : 0)} /></tr>}
              {shown.map((r) => {
                const id = p.rowKey(r);
                return (
                  <tr key={id} className="group cursor-pointer transition-colors hover:bg-soft" tabIndex={p.onRowOpen ? 0 : undefined} onClick={() => p.onRowOpen?.(r)} onKeyDown={(e) => e.key === "Enter" && p.onRowOpen?.(r)}>
                    {lead && <td className={cn(FIRST_COL, "border-b border-line px-4 py-3 align-middle")} onClick={(e) => e.stopPropagation()}>
                      <span className="flex items-center gap-2.5">
                        <span className="w-4 flex-none" aria-hidden />
                        {sel && <input type="checkbox" aria-label="Select row" checked={sel.ids.has(id)} onChange={() => { const n = new Set(sel.ids); if (n.has(id)) n.delete(id); else n.add(id); sel.onChange(n); }} className="size-4" />}
                      </span>
                    </td>}
                    {p.columns.map((c) => {
                      const w = wOf(c);
                      return <td key={c.key} style={w ? { maxWidth: w } : undefined} className={cn("border-b border-line px-3 py-3 align-middle", cellCls(c), align(c))}>{c.render(r)}</td>;
                    })}
                  </tr>
                );
              })}
              {windowed && last < p.rows.length && <tr aria-hidden style={{ height: (p.rows.length - last) * ROW_H }}><td colSpan={p.columns.length + (lead ? 1 : 0)} /></tr>}
            </tbody>
          )}
          {p.state === "loading" && (
            <tbody aria-busy="true">
              {Array.from({ length: 8 }, (_, i) => (
                <tr key={i}><td colSpan={p.columns.length + (lead ? 1 : 0)} className="border-b border-line px-3 py-3"><div className="h-6 animate-pulse rounded bg-soft" /></td></tr>
              ))}
            </tbody>
          )}
        </table>
        {p.state === "error" && (
          <div className="p-4"><Banner tone="error"><span>{p.errorMessage ?? "Could not load the list."}</span> <Button compact onClick={p.onRetry}>Retry</Button></Banner></div>
        )}
        {p.state === "empty" && p.emptyState}
      </div>
      {!p.hideFooter && <Pager {...p.page} />}
    </div>
  );
}
