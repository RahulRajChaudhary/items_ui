import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";

/**
 * The one card of the product. Everything card-shaped (settings group cards, section panels, detail headers) is this
 * component with different props, so the look and hover stay in one place.
 * `variant`: "group" is a bordered card with an optional tinted header; "panel" is a borderless rounded surface.
 * `title`/`icon`/`tint` draw the header (tint is a CSS color token); `grow` lets the card take its share of extra
 * column height; `hoverable` adds the hover lift. Must not fetch or know what the body contains.
 */
export function Card({ variant = "group", title, icon, tint, grow, hoverable, className, children }: { variant?: "group" | "panel"; title?: ReactNode; icon?: ReactNode; tint?: string; grow?: boolean; hoverable?: boolean; className?: string; children?: ReactNode }) {
  const headStyle: CSSProperties | undefined = tint ? { background: `linear-gradient(90deg, color-mix(in srgb, ${tint} 16%, var(--surface)), var(--surface))` } : undefined;
  return (
    <section
      className={cn(
        "bg-panel",
        variant === "group" ? "rounded-xl border border-line p-2" : "rounded-2xl p-5",
        hoverable && "transition-shadow hover:border-mute hover:shadow-[0_2px_10px_rgba(0,0,0,.12)]",
        grow && "flex-1",
        className,
      )}
    >
      {title && (
        <h3 className={cn("m-0 flex items-center gap-2 font-normal", variant === "group" ? "mb-1 rounded-lg bg-soft px-3 py-2.5 text-[1rem]" : "mb-4 text-[1.25rem]")} style={variant === "group" ? headStyle : undefined}>
          {icon && <span style={tint ? { color: tint } : undefined} aria-hidden>{icon}</span>}
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

/** One row inside a Card: a link when `href` is given, plain text otherwise. Has the hover highlight. Must not hold state. */
export function CardItem({ href, children }: { href?: string | null; children: ReactNode }) {
  const cls = "block rounded-md px-3 py-3 text-[0.875rem] transition-colors";
  return href ? <Link href={href} className={`${cls} hover:bg-soft`}>{children}</Link> : <span className={`${cls} cursor-default hover:bg-soft`}>{children}</span>;
}
