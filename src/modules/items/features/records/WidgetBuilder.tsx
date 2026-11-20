"use client";
import { useState } from "react";
import Link from "next/link";
import { Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/Button";
import { useRecord, useRecordMutations, useRecords } from "./hooks";

const STYLES = ["Modern", "Classic"];
type Rail = "plans" | "configure" | "customize";

/**
 * Pricing Widget builder (the ERP's full-screen editor): a left rail with Select Plans (choose and order the plans the
 * widget shows), Configure Plans (how each plan reads) and Customize Widget (the style); a live preview on the right
 * with Desktop and Mobile views; Save; and the embed-code box shown after saving. Only plans of the widget's product
 * are offered. Must not fetch outside its hooks.
 */
export function WidgetBuilder({ id }: { id: string }) {
  const q = useRecord("widgets", id);
  const plans = useRecords("plans", { filter_by: "All" });
  const { update } = useRecordMutations("widgets");
  const [rail, setRail] = useState<Rail>("plans");
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const [saved, setSaved] = useState(false);
  /** Edits on top of the saved widget; empty until the user changes something, so the saved values show first. */
  const [edit, setEdit] = useState<{ picked?: string[]; style?: string; name?: string }>({});
  const base = q.data;
  const picked = edit.picked ?? (Array.isArray(base?.plan_ids) ? (base.plan_ids as string[]) : []);
  const style = edit.style ?? (typeof base?.style === "string" ? base.style : "Modern");
  const name = edit.name ?? String(base?.name ?? "");
  const setPicked = (fn: (cur: string[]) => string[]) => { setSaved(false); setEdit((e) => ({ ...e, picked: fn(picked) })); };
  const setStyle = (v: string) => { setSaved(false); setEdit((e) => ({ ...e, style: v })); };
  const setName = (v: string) => { setSaved(false); setEdit((e) => ({ ...e, name: v })); };

  if (q.isError) return <div className="p-5"><Banner tone="error">{q.error.message}</Banner></div>;
  if (!q.data) return <div className="p-5" aria-busy="true"><div className="h-40 animate-pulse rounded-md bg-soft" /></div>;

  const product = String(base?.product ?? "");
  const available = (plans.data?.records ?? []).filter((p) => p.product === product);
  const chosen = picked.map((pid) => available.find((p) => p.id === pid)).filter((p): p is NonNullable<typeof p> => !!p);
  const toggle = (pid: string) => setPicked((cur) => (cur.includes(pid) ? cur.filter((x) => x !== pid) : [...cur, pid]));
  const move = (pid: string, dir: -1 | 1) => setPicked((cur) => { const i = cur.indexOf(pid); const j = i + dir; if (i < 0 || j < 0 || j >= cur.length) return cur; const n = [...cur]; [n[i], n[j]] = [n[j]!, n[i]!]; return n; });

  const save = () => update.mutate({ id, body: { ...base, name: name.trim(), plan_ids: picked, style } }, {
    onSuccess: () => { setSaved(true); setEdit({}); toast.success("The widget has been saved."); },
    onError: (e) => toast.error(e.message),
  });

  const railItem = (id2: Rail, label: string) => (
    <button type="button" aria-current={rail === id2 ? "true" : undefined} onClick={() => setRail(id2)} className={`flex w-full cursor-pointer flex-col items-center gap-1 border-0 px-2 py-3 text-[0.75rem] ${rail === id2 ? "bg-soft font-medium" : "bg-transparent text-mute"}`}>{label}</button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <input aria-label="Widget name" value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 max-w-xs rounded border border-transparent bg-transparent px-2 py-1 text-[1.125rem] font-medium hover:border-line" />
        <span className="text-mute">Style: <b className="font-medium">{style}</b></span>
        <span className="flex-1" />
        <div role="group" aria-label="Preview size" className="flex overflow-hidden rounded border border-line">
          <button type="button" aria-label="Desktop preview" aria-pressed={view === "desktop"} onClick={() => setView("desktop")} className={`cursor-pointer border-0 px-2.5 py-1.5 ${view === "desktop" ? "bg-primary text-primary-fg" : "bg-panel"}`}><Monitor size={15} /></button>
          <button type="button" aria-label="Mobile preview" aria-pressed={view === "mobile"} onClick={() => setView("mobile")} className={`cursor-pointer border-0 px-2.5 py-1.5 ${view === "mobile" ? "bg-primary text-primary-fg" : "bg-panel"}`}><Smartphone size={15} /></button>
        </div>
        <Button variant="primary" disabled={update.isPending || name.trim() === ""} onClick={save}>Save</Button>
        <Link href="/items/widgets" className="rounded border border-line px-3 py-[5px] text-inherit">Close</Link>
      </div>
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Widget steps" className="flex w-24 flex-none flex-col border-r border-line bg-panel">
          {railItem("plans", "Select Plans")}
          {railItem("configure", "Configure Plans")}
          {railItem("customize", "Customize Widget")}
        </nav>
        <div className="w-80 flex-none overflow-auto border-r border-line bg-panel p-4">
          {rail === "plans" && (
            <>
              <h3 className="m-0 mb-1 text-[1rem] font-normal">Select &amp; Reorder Plans</h3>
              <p className="mb-3 text-mute">Plans of {product || "this product"} that the widget shows, in order.</p>
              {available.length === 0 && <p className="text-mute">This product has no plans yet. Create a plan first.</p>}
              {available.map((p) => (
                <div key={p.id} className="mb-2 flex items-center gap-2 rounded-md border border-line px-3 py-2">
                  <input type="checkbox" aria-label={`Show ${String(p.name)}`} checked={picked.includes(p.id)} onChange={() => toggle(p.id)} className="size-4" />
                  <span className="flex-1">{String(p.name)}</span>
                  {picked.includes(p.id) && <>
                    <button type="button" aria-label={`Move ${String(p.name)} up`} onClick={() => move(p.id, -1)} className="cursor-pointer border-0 bg-transparent px-1">↑</button>
                    <button type="button" aria-label={`Move ${String(p.name)} down`} onClick={() => move(p.id, 1)} className="cursor-pointer border-0 bg-transparent px-1">↓</button>
                  </>}
                </div>
              ))}
            </>
          )}
          {rail === "configure" && (
            <>
              <h3 className="m-0 mb-1 text-[1rem] font-normal">Configure Plans</h3>
              <p className="text-mute">Each chosen plan shows its price and billing frequency, taken from the plan record. Edit a plan to change them.</p>
              <ul className="mt-3 list-none p-0">{chosen.map((p) => <li key={p.id} className="mb-2 rounded-md bg-soft px-3 py-2">{String(p.name)} · ₹{String(p.price)} · {String(p.frequency)}</li>)}</ul>
            </>
          )}
          {rail === "customize" && (
            <>
              <h3 className="m-0 mb-2 text-[1rem] font-normal">Customize Widget</h3>
              <label className="flex flex-col gap-1">Style
                <select aria-label="Widget style" value={style} onChange={(e) => setStyle(e.target.value)} className="rounded border border-line bg-panel px-2 py-2">{STYLES.map((s) => <option key={s}>{s}</option>)}</select>
              </label>
            </>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-4 overflow-auto bg-soft p-6">
          <div className={`w-full rounded-lg border border-line bg-panel p-4 ${view === "mobile" ? "max-w-[22rem]" : "max-w-3xl"}`}>
            {chosen.length === 0 ? <p className="m-0 py-10 text-center text-mute">Select at least one plan to preview the widget.</p> : (
              <div className={`grid gap-3 ${view === "mobile" ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"}`}>
                {chosen.map((p) => (
                  <div key={p.id} className="flex flex-col rounded-md border border-line bg-panel">
                    <div className="border-b border-line px-3 py-2 text-center uppercase tracking-wide">{String(p.name)}</div>
                    <div className="px-3 py-4 text-center"><div className="text-[1.5rem] font-medium">₹{String(p.price)}</div><div className="text-mute">{String(p.frequency)}</div></div>
                    <div className="mt-auto p-3"><div className="rounded-md bg-primary py-2 text-center text-primary-fg">Subscribe</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {saved && (
            <div className="w-full max-w-3xl">
              <p className="mb-1 font-medium">Embed this widget on your website</p>
              <pre className="overflow-auto rounded-md border border-line bg-panel p-3 text-[0.75rem]">{`<div id="boss-pricing-${id}" data-widget="${id}"></div>\n<script src="/widgets/pricing.js"></script>`}</pre>
              <p className="m-0 text-[0.75rem] text-mute">The script path is a placeholder until a widget host exists.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
