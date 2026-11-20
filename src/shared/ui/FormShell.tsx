"use client";
import { useEffect, type ReactNode } from "react";
import { Button } from "./Button";
import { Banner } from "./Banner";

/**
 * Frame for create/edit forms: title, body, sticky Save/Cancel footer, server error banner.
 * `submitting` disables Save (no double submit); `dirty` turns on the browser leave-page warning.
 * Must not validate or call the API.
 */
export function FormShell({ title, onSubmit, onCancel, submitting, dirty, error, children }: { title: string; onSubmit: () => void; onCancel: () => void; submitting: boolean; dirty: boolean; error?: string; children: ReactNode }) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex min-h-0 flex-1 flex-col bg-panel"
    >
      <div className="border-b border-line px-3.5 py-2.5">
        <h2 className="m-0 text-base font-semibold">{title}</h2>
      </div>
      <div className="flex-1 overflow-auto p-3.5">
        {error && (
          <div className="mb-3">
            <Banner tone="error">{error}</Banner>
          </div>
        )}
        <div className="flex max-w-[1000px] flex-col gap-3">{children}</div>
      </div>
      <div className="sticky bottom-0 flex gap-2 border-t border-line bg-panel px-[18px] py-2.5">
        <Button type="submit" variant="primary" disabled={submitting}>
          Save
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
