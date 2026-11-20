import type { ReactNode } from "react";

/**
 * Centered "nothing here" block: title, optional text, action buttons, optional illustration.
 * Must not fetch or decide which empty case applies (no data / no filter result / no permission).
 */
export function EmptyState({ title, text, actions, illustration }: { title: string; text?: string; actions?: ReactNode; illustration?: ReactNode }) {
  return (
    <div className="px-5 py-[34px] text-center text-mute">
      {illustration}
      <h3 className="m-0 mb-1.5 text-[1.125rem] font-medium text-ink">{title}</h3>
      {text && <p className="m-0">{text}</p>}
      {actions && <div className="mt-3 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
