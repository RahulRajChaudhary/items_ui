import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/** Shared look for text-like controls inside a Field (input, select, textarea). Pass as className. */
export const controlClass = "w-full min-w-0 rounded border border-line bg-panel px-3 py-2.5 text-[0.8125rem] text-ink";

/**
 * Label-left form row: label (with required marker), the control (`children`, whose id must equal `htmlFor`), hint and error.
 * Must not own the value or validate it.
 */
export function Field({ label, htmlFor, required, hint, error, children }: { label: string; htmlFor: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] items-center gap-2 text-[0.8125rem]">
      <label htmlFor={htmlFor} className={cn(required && "after:ml-0.5 after:text-bad after:content-['*']")}>
        {label}
      </label>
      <div className="flex flex-col gap-1">
        {children}
        {hint && <span className="text-[0.7188rem] text-mute">{hint}</span>}
        {error && (
          <span role="alert" className="text-[0.7188rem] text-bad">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
