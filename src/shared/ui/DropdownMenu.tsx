"use client";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, ChevronRight, Search } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type MenuItem = { id: string; label: string; icon?: ReactNode; checked?: boolean; keepOpen?: boolean; disabled?: boolean; danger?: boolean; onSelect: () => void };
export type MenuGroup = { label?: string; count?: number; collapsible?: boolean; divider?: boolean; items: MenuItem[] };

/**
 * Button that opens a menu or filter list, drawn above the page so no container can clip it.
 * `groups` hold items (optional heading with count; `collapsible` headings fold; `divider` draws a line above);
 * `searchable` adds a filter box; `footer` is a pinned link row. Keyboard: arrows move, Enter picks, Escape closes
 * and returns focus. Must not know what the items mean.
 */
export function DropdownMenu({ trigger, triggerLabel, groups, searchable, footer, align = "left", width, dense }: { trigger: ReactNode; triggerLabel: string; groups: MenuGroup[]; searchable?: boolean; footer?: MenuItem; align?: "left" | "right"; width?: number; dense?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [folded, setFolded] = useState<Set<number>>(new Set());
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const openedAt = useRef(0);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!root.current?.contains(t) && !menu.current?.contains(t)) setOpen(false);
    };
    const shut = (e: Event) => {
      if (e.type === "scroll" && Date.now() - openedAt.current < 400) return; // the scroll that brought the button into view must not close the menu
      if (e.target instanceof Node && menu.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", away);
    window.addEventListener("resize", shut);
    window.addEventListener("scroll", shut, true);
    return () => {
      document.removeEventListener("mousedown", away);
      window.removeEventListener("resize", shut);
      window.removeEventListener("scroll", shut, true);
    };
  }, [open]);
  /** Keep the menu inside the screen: it opens below the button and shrinks (scrolls inside) to fit; it only flips above when there is almost no room below. */
  useLayoutEffect(() => {
    if (!open || !menu.current || !btn.current) return;
    const el = menu.current;
    const b = btn.current.getBoundingClientRect();
    const pad = 8;
    const below = window.innerHeight - b.bottom - 4 - pad;
    const above = b.top - 4 - pad;
    const natural = el.scrollHeight;
    const flip = below < Math.min(natural, 140) && above > below;
    const room = flip ? above : below;
    el.style.maxHeight = `${Math.max(120, room)}px`;
    const h = Math.min(natural, Math.max(120, room));
    el.style.top = `${flip ? Math.max(pad, b.top - 4 - h) : b.bottom + 4}px`;
    const m = el.getBoundingClientRect();
    el.style.left = `${Math.min(Math.max(pad, m.left), Math.max(pad, window.innerWidth - pad - m.width))}px`;
    el.style.right = "auto";
  }, [open, q, folded]);
  useEffect(() => {
    if (!open && wasOpen.current) btn.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const close = () => {
    setOpen(false);
    setQ("");
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };
  const row = (m: MenuItem, link?: boolean) => (
    <button
      key={m.id}
      role="menuitem"
      type="button"
      disabled={m.disabled}
      onClick={() => {
        m.onSelect();
        if (!m.keepOpen) close();
      }}
      className={cn("mx-1.5 flex w-[calc(100%-0.75rem)] cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent px-3", dense ? "py-1.5" : "py-2.5", "text-left transition-colors hover:bg-soft focus-visible:bg-soft disabled:opacity-50", m.danger && "text-bad", link && "font-medium", m.checked && "font-semibold")}
    >
      {m.icon && <span className="inline-flex w-4 flex-none justify-center text-mute" aria-hidden>{m.icon}</span>}
      <span className="flex-1">{m.label}</span>
      {m.checked && <Check size={13} className="flex-none" />}
    </button>
  );
  const f = q.toLowerCase();
  return (
    <div ref={root} className="relative inline-block" onKeyDown={onKey}>
      <button
        ref={btn}
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (!open && btn.current && window.innerHeight - btn.current.getBoundingClientRect().bottom < 360) btn.current.scrollIntoView({ block: "center", behavior: "instant" });
          const r = btn.current?.getBoundingClientRect();
          if (r) setPos({ top: r.bottom + 4, ...(align === "right" ? { right: window.innerWidth - r.right } : { left: r.left }) });
          openedAt.current = Date.now();
          setOpen((o) => !o);
        }}
        className="cursor-pointer border-0 bg-transparent text-inherit"
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div ref={menu} id={id} role="menu" style={{ width, ...pos }} className="fixed z-50 flex max-h-[calc(100vh-1rem)] min-w-[200px] flex-col rounded-lg border border-line bg-panel py-1.5 text-[0.875rem] text-ink shadow-[0_8px_24px_rgba(0,0,0,.25)]">
            {searchable && (
              <div className="px-2 pb-1.5">
                <label className="flex items-center gap-2 rounded-md border border-line bg-panel px-2.5 py-2 focus-within:border-mute">
                  <Search size={14} className="text-mute" aria-hidden />
                  <input type="text" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search" className="w-full min-w-0 border-0 bg-transparent text-inherit outline-none" />
                </label>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-auto">
              {groups.map((g, gi) => {
                const items = g.items.filter((m) => !f || m.label.toLowerCase().includes(f));
                if (!items.length) return null;
                const isFolded = !!g.collapsible && folded.has(gi) && !f;
                return (
                  <div key={gi} className={cn(g.divider && "mt-1 border-t border-line pt-1")}>
                    {g.label && (
                      <button
                        type="button"
                        disabled={!g.collapsible}
                        onClick={() => setFolded((s) => { const n = new Set(s); if (n.has(gi)) n.delete(gi); else n.add(gi); return n; })}
                        className="mx-1.5 flex w-[calc(100%-0.75rem)] items-center gap-1.5 rounded-md border-0 bg-soft px-3 py-2 text-left text-[0.75rem] font-semibold tracking-wide text-ink enabled:cursor-pointer"
                      >
                        {g.collapsible && (isFolded ? <ChevronRight size={12} /> : <ChevronDown size={12} />)}
                        <span className="flex-1">{g.label}</span>
                        {g.count !== undefined && <span className="rounded-full bg-primary px-2 text-[0.6875rem] font-medium text-primary-fg">{g.count}</span>}
                      </button>
                    )}
                    {!isFolded && items.map((m) => row(m))}
                  </div>
                );
              })}
            </div>
            {footer && <div className="mt-1 border-t border-line pt-1">{row(footer, true)}</div>}
          </div>,
          document.body,
        )}
    </div>
  );
}
