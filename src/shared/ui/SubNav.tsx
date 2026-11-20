"use client";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { DropdownMenu } from "./DropdownMenu";

export type SubNavItem = { id: string; label: string; menu?: { id: string; label: string }[] };

/**
 * Module tab strip. A tab with `menu` opens a dropdown of sub-entries. `activeId` is the highlighted tab;
 * `onSelect` gets the tab id or the menu entry id. Must not route by itself.
 */
export function SubNav({ items, activeId, onSelect }: { items: SubNavItem[]; activeId: string; onSelect: (id: string) => void }) {
  const base = "flex cursor-pointer items-center gap-1 whitespace-nowrap border-0 border-b-2 bg-transparent px-3.5 py-[9px]";
  return (
    <nav aria-label="Module" className="flex flex-none overflow-x-auto border-b border-line bg-panel">
      {items.map((it) => {
        const on = it.id === activeId;
        const cls = cn(base, on ? "border-acc font-semibold text-acc" : "border-transparent text-mute");
        return it.menu ? (
          <div key={it.id} className={cn("flex border-b-2", on ? "border-acc" : "border-transparent")}>
            <DropdownMenu
              triggerLabel={it.label}
              trigger={<span className={cn("flex items-center gap-1 px-3.5 py-[9px]", on ? "font-semibold text-acc" : "text-mute")}>{it.label}<ChevronDown size={12} /></span>}
              groups={[{ items: it.menu.map((m) => ({ id: m.id, label: m.label, onSelect: () => onSelect(m.id) })) }]}
            />
          </div>
        ) : (
          <button key={it.id} type="button" aria-current={on ? "page" : undefined} onClick={() => onSelect(it.id)} className={cls}>
            {it.label}
          </button>
        );
      })}
    </nav>
  );
}
