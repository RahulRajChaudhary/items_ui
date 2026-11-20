"use client";
import type { ReactNode } from "react";
import { SubNav, type SubNavItem } from "@/shared/ui/SubNav";

/** Module tabs, exactly as in the wireframe. "Items" and "Plans and Addons" open dropdowns. */
export const ITEMS_SUBNAV: SubNavItem[] = [
  { id: "Items", label: "Items", menu: [{ id: "Items", label: "Items" }, { id: "Composite Items", label: "Composite Items" }] },
  { id: "Bill of Materials", label: "Bill of Materials" },
  { id: "Plans and Addons", label: "Plans and Addons", menu: [{ id: "Plans", label: "Plans" }, { id: "Addons", label: "Addons" }] },
  { id: "Price Lists", label: "Price Lists" },
  { id: "Pricing Widgets", label: "Pricing Widgets" },
  { id: "Coupons", label: "Coupons" },
];

/**
 * Content frame of the Items module: the module tab strip over the screen. The BOSS layout (header, rail, drawer)
 * is supplied by the host around it. `activeTab` is the highlighted tab id; `onTab` gets a tab or menu entry id;
 * `children` is the screen. Must not fetch data or navigate by itself.
 */
export function ItemsFrame({ activeTab, onTab, children }: { activeTab: string; onTab: (id: string) => void; children: ReactNode }) {
  return (
    <div className="flex h-[calc(100dvh-var(--header-h)-1rem)] min-h-[30rem] min-w-0 flex-col overflow-hidden rounded-xl bg-panel text-[length:var(--font-caption)]">
      <SubNav items={ITEMS_SUBNAV} activeId={activeTab} onSelect={onTab} />
      <div className="relative flex min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
