import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type Tone = "info" | "warning" | "error" | "success";

const TONES: Record<Tone, string> = {
  info: "bg-callout border-transparent",
  warning: "bg-callout border-warn",
  error: "border-bad bg-[color-mix(in_srgb,var(--bad)_14%,var(--panel))]",
  success: "border-ok bg-[color-mix(in_srgb,var(--ok)_14%,var(--panel))]",
};

/**
 * Inline message box. `tone` sets color, `children` is the message, `onDismiss` adds a close button.
 * Must not own any timer or hide itself.
 */
export function Banner({ tone, children, onDismiss }: { tone: Tone; children: ReactNode; onDismiss?: () => void }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-center gap-2 rounded-md border px-3 py-2", TONES[tone])}>
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button type="button" aria-label="Dismiss" onClick={onDismiss} className="cursor-pointer">
          <X size={12} />
        </button>
      )}
    </div>
  );
}
