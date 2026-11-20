"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { SNAV, entryHref } from "./snav";

/**
 * Settings area frame: title strip ("All Settings", organization, search box, Close Settings) over a collapsible
 * left menu of grouped accordions and the page. `children` is the settings page. Shown inside the host layout.
 * Must not hold any setting values.
 */
export function SettingsFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const home = pathname === "/setup";
  const [open, setOpen] = useState<string | null>(pathname.startsWith("/setup/items") ? "General" : null);
  return (
    <div className="flex h-[calc(100dvh-var(--header-h)-1rem)] min-h-[30rem] min-w-0 flex-col overflow-hidden rounded-xl bg-panel text-[length:var(--font-caption)]">
      <div className="flex h-[52px] flex-none items-center gap-2.5 border-b border-line px-3">
        {!home && <button type="button" aria-label="Collapse settings menu" onClick={() => setCollapsed((c) => !c)} className="cursor-pointer rounded border border-line bg-panel px-2 py-[5px]">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>}
        <div>
          <b>All Settings</b>
          <div className="text-[0.7188rem] text-mute">Rahul pvt ltd</div>
        </div>
        <div className="mx-auto hidden max-w-[420px] flex-1 rounded-full border border-line px-3.5 py-[5px] text-mute min-[900px]:block">Search settings ( / )</div>
        <span className="flex-1 min-[900px]:hidden" />
        <Link href="/items" className="whitespace-nowrap rounded border border-line bg-panel px-3 py-[5px]">
          Close Settings ✕
        </Link>
      </div>
      <div className="flex min-h-0 flex-1">
        {!collapsed && !home && (
          <nav aria-label="Settings" className="hidden w-[230px] flex-none overflow-auto border-r border-line text-[0.7812rem] min-[761px]:block">
            {Object.entries(SNAV).map(([section, groups]) => (
              <div key={section}>
                <h5 className="mx-3.5 mb-1 mt-3 text-[0.6562rem] tracking-[.05em] text-mute">{section}</h5>
                {Object.entries(groups).map(([group, entries]) => {
                  const isOpen = open === group;
                  return (
                    <div key={group}>
                      <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : group)} className={cn("flex w-full cursor-pointer items-center gap-1.5 border-0 px-3.5 py-2.5 text-left text-[1rem]", isOpen ? "mx-1.5 w-[calc(100%-12px)] rounded-lg bg-soft" : "bg-transparent")}>
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />} {group}
                      </button>
                      {isOpen &&
                        entries.map((e) => {
                          const href = entryHref(group, e);
                          const on = !!href && pathname.startsWith(href);
                          const cls = cn("block w-full py-2.5 pl-[30px] pr-3.5 text-left", on ? "mx-2 w-[calc(100%-16px)] rounded-md bg-[var(--primary)] pl-[22px] font-medium text-[var(--primary-foreground)]" : "text-mute");
                          return href ? (
                            <Link key={e} href={href} className={cls} aria-current={on ? "page" : undefined}>
                              {e}
                            </Link>
                          ) : (
                            <span key={e} className={cn(cls, "cursor-default")}>
                              {e}
                            </span>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        )}
        <div className="flex min-w-0 flex-1 flex-col bg-panel">{children}</div>
      </div>
    </div>
  );
}
