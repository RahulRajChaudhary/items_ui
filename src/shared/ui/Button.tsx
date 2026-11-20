import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * The one button style (wireframe .btn). `variant`: default, primary, danger. `compact` is the small size.
 * Always renders a real <button>; icon-only uses must pass aria-label.
 */
export function Button({ variant = "default", compact, className, type = "button", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "danger"; compact?: boolean }) {
  return (
    <button
      type={type}
      className={cn(
        "cursor-pointer whitespace-nowrap rounded border border-line bg-panel text-inherit disabled:cursor-not-allowed disabled:opacity-50",
        compact ? "px-2 py-0.5 text-[0.75rem]" : "px-3 py-[5px]",
        variant === "primary" && "border-primary bg-primary text-primary-fg",
        variant === "danger" && "text-bad",
        className,
      )}
      {...rest}
    />
  );
}
