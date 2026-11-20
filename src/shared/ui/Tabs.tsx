import { cn } from "@/shared/lib/cn";

/**
 * Tab bar. `tabs` have an id, label and optional count badge; `activeId` and `onChange` are controlled by the caller
 * (keep the active tab in the URL). Must not render tab content.
 */
export function Tabs({ tabs, activeId, onChange, label = "Tabs" }: { tabs: { id: string; label: string; count?: number }[]; activeId: string; onChange: (id: string) => void; label?: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex overflow-x-auto border-b border-line bg-panel">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={t.id === activeId}
          onClick={() => onChange(t.id)}
          className={cn("cursor-pointer whitespace-nowrap border-0 border-b-2 bg-transparent px-4 py-2.5", t.id === activeId ? "border-acc font-semibold text-acc" : "border-transparent text-mute")}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-[9px] bg-soft px-1.5 text-[0.6875rem]">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
