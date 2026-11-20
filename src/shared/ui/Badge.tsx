import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  neutral: "text-mute border-line",
  success: "text-ok border-ok",
  warning: "text-warn border-warn",
  danger: "text-bad border-bad",
  info: "text-acc border-acc",
};

/**
 * Small pill for a status or a count (also serves as the status pill).
 * `tone` picks the color; `children` is the text. Must not decide what a status means.
 */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-block rounded-[10px] border bg-soft px-2 py-px text-[0.6875rem]", TONES[tone])}>
      {children}
    </span>
  );
}
