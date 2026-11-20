"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * Dialog with focus trap. `open` shows it; `onClose` runs on Escape or backdrop click; `size` sets width;
 * `footer` is pinned under the body. Returns focus to the opener on close. Must not hold form state.
 */
export function Modal({ title, open, onClose, size = "md", footer, children }: { title: string; open: boolean; onClose: () => void; size?: "sm" | "md" | "lg"; footer?: ReactNode; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () => box.current?.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])') ?? [];
    (focusables()[0] ?? box.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const f = Array.from(focusables());
      const first = f[0];
      const last = f[f.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  const width = size === "sm" ? "w-[min(420px,94%)]" : size === "lg" ? "w-[min(760px,94%)]" : "w-[min(520px,94%)]";
  return (
    <div className="fixed inset-0 z-30 grid place-items-start justify-center overflow-auto bg-black/45 pt-[50px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={cn("mb-[30px] flex flex-col gap-2.5 rounded-lg bg-panel p-4", width)}>
        <h3 className="m-0 text-base font-medium">{title}</h3>
        {children}
        {footer && <div className="flex gap-2 border-t border-line pt-3">{footer}</div>}
      </div>
    </div>
  );
}
