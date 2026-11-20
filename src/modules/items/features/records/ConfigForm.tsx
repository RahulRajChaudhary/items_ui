"use client";
import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch, type Control, type UseFormRegister, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Field, controlClass } from "@/shared/ui/Field";
import { FormShell } from "@/shared/ui/FormShell";
import { Modal } from "@/shared/ui/Modal";
import { Tabs } from "@/shared/ui/Tabs";
import type { FieldDef, SectionDef, Values } from "./types";

const visible = (f: FieldDef, v: Values) => !f.showIf || f.showIf(v);
const flat = (sections: SectionDef[]) => sections.flatMap((s) => s.fields);

/** Starting values: the record's own, then the defaults, then an empty value for each kind. */
export function defaultsFor(sections: SectionDef[], record?: Values, base?: Values): Values {
  const out: Values = {};
  for (const f of flat(sections)) {
    const have = record?.[f.key] ?? base?.[f.key];
    out[f.key] = have ?? (f.kind === "rows" ? [] : f.kind === "switch" ? false : f.kind === "radio" || f.kind === "select" ? (f.required ? (f.options?.[0] ?? "") : "") : "");
    if (f.kind === "number" || f.kind === "money") out[f.key] = have === undefined || have === null ? "" : String(have);
  }
  return out;
}

/** One zod schema for the whole form, built from the field list: required text, numbers, lengths, and each table row. */
export function schemaFor(sections: SectionDef[]) {
  const check = (fields: FieldDef[], v: Values, ctx: z.RefinementCtx, path: (string | number)[]) => {
    for (const f of fields) {
      if (!visible(f, v)) continue;
      const val = v[f.key];
      const p = [...path, f.key];
      if (f.kind === "rows") {
        const rows = Array.isArray(val) ? (val as Values[]) : [];
        rows.forEach((row, i) => check(f.rows ?? [], row, ctx, [...path, f.key, i]));
        if (f.required && rows.length === 0) ctx.addIssue({ code: "custom", path: p, message: `Add at least one ${f.label.toLowerCase()} row.` });
        continue;
      }
      const s = typeof val === "string" ? val.trim() : val === undefined || val === null ? "" : String(val);
      if (f.required && f.kind !== "switch" && s === "") ctx.addIssue({ code: "custom", path: p, message: `Enter ${f.label}.` });
      if ((f.kind === "number" || f.kind === "money") && s !== "" && (Number.isNaN(Number(s)) || Number(s) < 0)) ctx.addIssue({ code: "custom", path: p, message: "Enter a valid amount." });
      if (f.max && s.length > f.max) ctx.addIssue({ code: "custom", path: p, message: `Please ensure that ${f.label} has less than ${f.max} characters.` });
    }
  };
  return z.record(z.string(), z.unknown()).superRefine((v, ctx) => check(flat(sections), v, ctx, []));
}

/** Form values -> the body the API takes: hidden fields dropped, numbers as numbers. */
export function toBody(sections: SectionDef[], v: Values): Values {
  const out: Values = {};
  const conv = (fields: FieldDef[], values: Values): Values => {
    const r: Values = {};
    for (const f of fields) {
      if (!visible(f, values)) continue;
      const val = values[f.key];
      if (f.kind === "rows") r[f.key] = ((val as Values[]) ?? []).map((row) => conv(f.rows ?? [], row));
      else if (f.kind === "number" || f.kind === "money") r[f.key] = String(val ?? "").trim() === "" ? 0 : Number(val);
      else r[f.key] = typeof val === "string" ? val.trim() : val;
    }
    return r;
  };
  Object.assign(out, conv(flat(sections), v));
  return out;
}

type Ctl = { register: UseFormRegister<FieldValues>; control: Control<FieldValues>; errors: Record<string, unknown> };

function errorAt(errors: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = errors;
  for (const k of parts) { if (cur && typeof cur === "object") cur = (cur as Record<string, unknown>)[k]; else return undefined; }
  return (cur as { message?: string } | undefined)?.message;
}

function Control1({ f, name, c, id }: { f: FieldDef; name: string; c: Ctl; id: string }) {
  if (f.kind === "textarea") return <textarea id={id} rows={3} className={controlClass} {...c.register(name)} />;
  if (f.kind === "select") return <select id={id} className={controlClass} {...c.register(name)}><option value="">Select</option>{(f.options ?? []).map((o) => <option key={o}>{o}</option>)}</select>;
  if (f.kind === "radio") return <div className="flex flex-wrap gap-5">{(f.options ?? []).map((o) => <label key={o} className="flex items-center gap-2"><input type="radio" value={o} {...c.register(name)} />{o}</label>)}</div>;
  if (f.kind === "switch") return <label className="flex items-center gap-2"><input id={id} type="checkbox" {...c.register(name)} />{f.hint ?? ""}</label>;
  if (f.kind === "date") return <input id={id} type="date" className={controlClass} {...c.register(name)} />;
  const input = <input id={id} type={f.kind === "text" ? "text" : "number"} step="any" min={f.kind === "text" ? undefined : 0} className={`${controlClass} ${f.prefix ? "rounded-l-none" : ""}`} {...c.register(name)} />;
  return f.prefix ? <div className="flex"><span className="rounded-l border border-r-0 border-line bg-soft px-3 py-2 text-mute">{f.prefix}</span>{input}</div> : input;
}

function RowsField({ f, c, values }: { f: FieldDef; c: Ctl; values: Values }) {
  const { fields, append, remove } = useFieldArray({ control: c.control, name: f.key });
  const cols = f.rows ?? [];
  return (
    <div className="min-[1000px]:col-span-2">
      <div className="overflow-auto rounded-md border border-line">
        <table className="w-full border-collapse">
          <thead><tr>{cols.map((col) => <th key={col.key} className="border-b border-line bg-soft px-3 py-2 text-left text-[0.75rem] font-medium uppercase text-mute">{col.label}</th>)}<th className="w-10 border-b border-line bg-soft" /></tr></thead>
          <tbody>
            {fields.map((row, i) => (
              <tr key={row.id}>
                {cols.map((col) => (
                  <td key={col.key} className="border-b border-line px-2 py-1.5 align-top">
                    <Control1 f={col} name={`${f.key}.${i}.${col.key}`} c={c} id={`${f.key}-${i}-${col.key}`} />
                    {errorAt(c.errors, `${f.key}.${i}.${col.key}`) && <span role="alert" className="text-[0.71875rem] text-bad">{errorAt(c.errors, `${f.key}.${i}.${col.key}`)}</span>}
                  </td>
                ))}
                <td className="border-b border-line px-1 text-center"><button type="button" aria-label={`Delete ${f.label} row ${i + 1}`} onClick={() => remove(i)} className="cursor-pointer border-0 bg-transparent p-1 text-bad"><Trash2 size={14} /></button></td>
              </tr>
            ))}
            {fields.length === 0 && <tr><td colSpan={cols.length + 1} className="px-3 py-4 text-center text-mute">No rows yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <Button className="mt-2" onClick={() => append(Object.fromEntries(cols.map((col) => [col.key, col.kind === "select" && col.options ? col.options[0] : ""])) as never)}><Plus size={14} className="mr-1 inline" />{f.addLabel ?? "Add row"}</Button>
      {errorAt(c.errors, f.key) && <p role="alert" className="mb-0 mt-1 text-[0.71875rem] text-bad">{errorAt(c.errors, f.key)}</p>}
      <span className="sr-only">{Array.isArray(values[f.key]) ? (values[f.key] as unknown[]).length : 0} rows</span>
    </div>
  );
}

/**
 * Form generated from a field list (`sections`). Used for every module tab's New/Edit (page) and for the small
 * settings dialogs (modal). Required fields, number checks, text limits, table rows and tabs all come from the
 * definition. `onSubmit` returns a promise; if it throws, the sentence is shown in a banner and the input stays.
 * Must not call the API itself.
 */
export function ConfigForm({ title, sections, record, base, variant = "page", submitLabel = "Save", onSubmit, onCancel }: { title: string; sections: SectionDef[]; record?: Values; base?: Values; variant?: "page" | "modal"; submitLabel?: string; onSubmit: (body: Values) => Promise<void>; onCancel: () => void }) {
  const defaults = useMemo(() => defaultsFor(sections, record, base), [sections, record, base]);
  const schema = useMemo(() => schemaFor(sections), [sections]);
  const form = useForm<FieldValues>({ resolver: zodResolver(schema), defaultValues: defaults });
  const values = useWatch({ control: form.control }) as Values;
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const tabs = Array.from(new Set(sections.map((s) => s.tab).filter((t): t is string => !!t)));
  const [tab, setTab] = useState(tabs[0] ?? "");
  const c: Ctl = { register: form.register, control: form.control, errors: form.formState.errors as Record<string, unknown> };

  const submit = form.handleSubmit(async (v) => {
    setError(undefined);
    setBusy(true);
    try { await onSubmit(toBody(sections, v)); } catch (e) { setError(e instanceof Error ? e.message : "Could not save."); } finally { setBusy(false); }
  });

  const body = (
    <div className="flex flex-col gap-6">
      {tabs.length > 0 && <Tabs tabs={tabs.map((t) => ({ id: t, label: t }))} activeId={tab} onChange={setTab} label="Form sections" />}
      {sections.filter((s) => !s.tab || s.tab === tab).map((s, i) => (
        <section key={i} className={i > 0 ? "border-t border-line pt-5" : ""}>
          {s.title && <h3 className="m-0 mb-4 text-[1.0625rem] font-normal">{s.title}</h3>}
          <div className="grid gap-x-10 gap-y-4 min-[1000px]:grid-cols-2">
            {s.fields.filter((f) => visible(f, values)).map((f) => f.kind === "rows"
              ? <RowsField key={f.key} f={f} c={c} values={values} />
              : <Field key={f.key} label={f.label} htmlFor={f.key} required={f.required} hint={f.kind === "switch" ? undefined : f.hint} error={errorAt(c.errors, f.key)}><Control1 f={f} name={f.key} c={c} id={f.key} /></Field>)}
          </div>
        </section>
      ))}
    </div>
  );

  if (variant === "modal") {
    return (
      <Modal title={title} open onClose={onCancel} size="md" footer={<><Button variant="primary" disabled={busy} onClick={submit}>{submitLabel}</Button><Button onClick={onCancel}>Cancel</Button></>}>
        {error && <p role="alert" className="m-0 rounded-md border border-bad px-3 py-2 text-bad">{error}</p>}
        {body}
      </Modal>
    );
  }
  return <FormShell title={title} onSubmit={submit} onCancel={onCancel} submitting={busy} dirty={form.formState.isDirty} error={error}>{body}</FormShell>;
}
