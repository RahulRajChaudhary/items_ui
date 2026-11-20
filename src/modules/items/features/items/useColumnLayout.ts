"use client";
import { useCallback, useState } from "react";

type Saved = { order: string[]; selected: string[]; wrap: boolean; widths: Record<string, number> };
const KEY = "boss.items.columns.v1";

function load(defaults: string[], all: string[]): Saved {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Saved;
      if (Array.isArray(s.order) && Array.isArray(s.selected)) return { order: s.order.filter((k) => all.includes(k)), selected: s.selected.filter((k) => all.includes(k)), wrap: !!s.wrap, widths: s.widths ?? {} };
    }
  } catch {
    /* storage blocked or corrupt: fall back to defaults */
  }
  return { order: all, selected: defaults, wrap: false, widths: {} };
}

/**
 * Per-user column choice for the Items list: which columns, in what order, and clip/wrap text.
 * Stored in this browser only; where BOSS should store it is an open question (see the brief), so it is one place to change.
 */
export function useColumnLayout(defaults: string[], all: string[]) {
  const [saved, setSaved] = useState<Saved>(() => (typeof window === "undefined" ? { order: all, selected: defaults, wrap: false, widths: {} } : load(defaults, all)));
  const persist = useCallback((s: Saved) => {
    setSaved(s);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* storage blocked: keep in memory only */
    }
  }, []);
  return {
    order: saved.order,
    selected: saved.order.filter((k) => saved.selected.includes(k)),
    wrap: saved.wrap,
    widths: saved.widths,
    setWidth: (key: string, width: number) => persist({ ...saved, widths: { ...saved.widths, [key]: width } }),
    setWrap: (wrap: boolean) => persist({ ...saved, wrap }),
    save: (order: string[], selected: string[]) => persist({ ...saved, order, selected }),
    /** Reset Column Width: clears dragged widths only; chosen columns and order stay. */
    reset: () => persist({ ...saved, widths: {} }),
  };
}
