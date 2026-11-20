"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/Button";
import { Field, controlClass } from "@/shared/ui/Field";
import { FormShell } from "@/shared/ui/FormShell";
import { Modal } from "@/shared/ui/Modal";
import type { ItemInputDto } from "../../api/contract";
import type { Item } from "../../domain/types";
import { useItemSettings } from "../../settings/useItemSettings";
import { useEditPage, useItemMutations } from "./mutations";
import { useItem } from "./hooks";
import { useItemExtras } from "./useItemExtras";

/** Form values are strings and booleans (what inputs hold); `toInput` turns them into the API body. */
const schema = z.looseObject({
  name: z.string().trim().min(1, "Enter a Name for the item.").max(100, 'Please ensure that the "name" has less than 100 characters.'),
  alias: z.string(), type: z.enum(["goods", "service"]), category: z.string(), brand: z.string(), manufacturer: z.string(),
  unit: z.string(), sku: z.string(), upc: z.string(), ean: z.string(), mpn: z.string(), isbn: z.string(),
  description: z.string().max(250, "Please ensure that the description has less than 250 characters."),
  rate: z.string().refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Enter a valid amount."),
  mrp: z.string().refine((v) => v === "" || !Number.isNaN(Number(v)), "Enter a valid amount."),
  salesAccount: z.string(), salesDescription: z.string(), minProfit: z.string(),
  cost: z.string().refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Enter a valid amount."),
  purchaseAccount: z.string(), purchaseDescription: z.string(), vendor: z.string(),
  track: z.boolean(), tracking: z.enum(["none", "serial", "batch"]), bin: z.enum(["true", "false"]), inventoryAccount: z.string(), valuation: z.enum(["FIFO", "WAC"]),
  grniAccount: z.string(), varianceAccount: z.string(), reorder: z.string(),
  returnable: z.enum(["true", "false"]), dimensions: z.string(), weight: z.string(),
}).superRefine((v, ctx) => {
  if (v.type === "goods" && v.unit.trim() === "") ctx.addIssue({ code: "custom", path: ["unit"], message: "Select a unit." });
  if (v.type === "goods" && v.track && v.inventoryAccount === "") ctx.addIssue({ code: "custom", path: ["inventoryAccount"], message: "Select an inventory account." });
});
type Values = z.infer<typeof schema>;

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));

function toInput(v: Values, custom: [string, string][] = []): ItemInputDto {
  const goods = v.type === "goods";
  return {
    name: v.name.trim(), sku: v.sku, product_type: v.type, unit: goods ? v.unit : "", rate: num(v.rate) ?? 0, purchase_rate: num(v.cost) ?? 0,
    description: v.salesDescription || v.description, purchase_description: v.purchaseDescription, category_name: v.category, brand: v.brand, manufacturer: v.manufacturer,
    account_name: v.salesAccount, purchase_account_name: v.purchaseAccount, track_inventory: goods && v.track, inventory_valuation_method: goods && v.track ? v.valuation : "",
    is_returnable: goods && v.returnable === "true", reorder_level: goods && v.track ? num(v.reorder) : null, alias_name: v.alias, upc: v.upc, ean: v.ean, mpn: v.mpn, isbn: v.isbn,
    weight: v.weight, dimensions: v.dimensions, mrp: num(v.mrp), min_profit_percent: num(v.minProfit), vendor: v.vendor, inventory_account: v.inventoryAccount, bin_tracking: v.bin === "true", custom_fields: Object.fromEntries(custom.map(([id, name]) => [name, String((v as Record<string, unknown>)[`cf_${id}`] ?? "")])), tracking_type: goods && v.track ? v.tracking : "none",
  };
}

function fromItem(i: Item, defaults: Values): Values {
  return { ...defaults, name: i.name, type: i.isService ? "service" : "goods", category: i.category, brand: i.brand, manufacturer: i.manufacturer, unit: i.unit, sku: i.sku,
    description: i.description, rate: String(i.sellingPrice), salesAccount: i.salesAccount || defaults.salesAccount, salesDescription: i.description, cost: String(i.costPrice),
    purchaseAccount: i.purchaseAccount || defaults.purchaseAccount, purchaseDescription: i.purchaseDescription, track: i.tracksInventory, tracking: i.tracking,
    valuation: i.valuationMethod === "WAC" ? "WAC" : "FIFO", reorder: i.reorderLevel == null ? "" : String(i.reorderLevel), returnable: i.returnable ? "true" : "false" };
}

/** Section frame: title, then children in the ERP's two-column label-left grid. */
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-5 first:border-0 first:pt-0">
      {title && <h3 className="m-0 mb-4 text-[1.0625rem] font-normal">{title}</h3>}
      <div className="grid gap-x-10 gap-y-4 min-[1000px]:grid-cols-2">{children}</div>
    </section>
  );
}

function Text({ name, label, register, errors, required, hint, prefix, ...rest }: { name: keyof Values; label: string; register: UseFormRegister<Values>; errors: FieldErrors<Values>; required?: boolean; hint?: string; prefix?: string; placeholder?: string; multiline?: boolean }) {
  const err = errors[name]?.message as string | undefined;
  const control = rest.multiline
    ? <textarea id={name} rows={3} className={controlClass} {...register(name)} />
    : <div className="flex"><span className={prefix ? "rounded-l border border-r-0 border-line bg-soft px-3 py-2 text-mute" : "hidden"}>{prefix}</span><input id={name} className={`${controlClass} ${prefix ? "rounded-l-none" : ""}`} placeholder={rest.placeholder} {...register(name)} /></div>;
  return <Field label={label} htmlFor={name} required={required} error={err} hint={hint}>{control}</Field>;
}

function Pick({ name, label, options, register, errors, required, placeholder, empty = true }: { name: keyof Values; label: string; options: string[] | { id: string; label: string }[]; register: UseFormRegister<Values>; errors: FieldErrors<Values>; required?: boolean; placeholder?: string; empty?: boolean }) {
  return (
    <Field label={label} htmlFor={name} required={required} error={errors[name]?.message as string | undefined}>
      <select id={name} className={controlClass} {...register(name)}>
        {empty && <option value="">{placeholder ?? "Select"}</option>}
        {options.map((o) => (typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.id} value={o.id}>{o.label}</option>))}
      </select>
    </Field>
  );
}

function Radios({ name, label, options, register }: { name: keyof Values; label: string; options: [string, string][]; register: UseFormRegister<Values> }) {
  return (
    <Field label={label} htmlFor={`${name}-0`}>
      <div className="flex gap-6">{options.map(([v, l], k) => <label key={v} className="flex items-center gap-2"><input id={`${name}-${k}`} type="radio" value={v} {...register(name)} />{l}</label>)}</div>
    </Field>
  );
}

/**
 * New Item and Edit Item, one form. The layout follows the ERP's New Item page: name, type, category/brand/manufacturer and
 * image boxes; Item Details; Sales and Purchase information; inventory (only for goods that track stock, and only when
 * inventory tracking is on in settings); returns and fulfilment (dimension and weight units come from settings).
 * `id` is set for edit. The server sentence is shown in a banner and the input is kept. Must not call the API except through hooks.
 */
export function ItemForm({ id, onDone, onCancel }: { id?: string; onDone: (id: string) => void; onCancel: () => void }) {
  const { settings } = useItemSettings();
  const lists = useEditPage();
  const existing = useItem(id);
  const { create, update } = useItemMutations();
  const extras = useItemExtras();
  const on = extras.isActive;
  const req = extras.isMandatory;
  const [serverError, setServerError] = useState<string>();
  const [leave, setLeave] = useState(false);

  const defaults: Values = useMemo(() => ({
    name: "", alias: "", type: "goods", category: "", brand: "", manufacturer: "", unit: "", sku: "", upc: "", ean: "", mpn: "", isbn: "", description: "",
    rate: "", mrp: "", salesAccount: "Sales", salesDescription: "", minProfit: "", cost: "", purchaseAccount: "Cost of Goods Sold", purchaseDescription: "", vendor: "",
    track: settings?.inventoryEnabled !== false, tracking: "none", bin: "false", inventoryAccount: "", valuation: settings?.defaultValuation ?? "FIFO", grniAccount: "Accrued Purchases", varianceAccount: "Purchase Price Variance",
    reorder: "", returnable: "true", dimensions: "", weight: "",
  }), [settings?.defaultValuation, settings?.inventoryEnabled]);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults });
  const { register, handleSubmit, control, reset, formState: { errors, isDirty } } = form;
  useEffect(() => { if (existing.data) reset(fromItem(existing.data, defaults)); }, [existing.data, defaults, reset]);

  const type = useWatch({ control, name: "type" });
  const track = useWatch({ control, name: "track" });
  const goods = type === "goods";
  const stocked = goods && track && settings?.inventoryEnabled !== false;
  const pending = create.isPending || update.isPending;
  const loading = lists.isPending || (!!id && existing.isPending);

  const MANDATORY: [string, keyof Values][] = [["Alias Name", "alias"], ["Category", "category"], ["Brand", "brand"], ["Manufacturer", "manufacturer"], ["SKU", "sku"], ["MRP", "mrp"], ["Minimum Profit Percentage", "minProfit"], ["Preferred Vendor", "vendor"], ["Selling Price", "rate"], ["Purchase Price", "cost"], ["UPC", "upc"], ["MPN", "mpn"], ["EAN", "ean"], ["ISBN", "isbn"]];
  const onSubmit = handleSubmit(async (v) => {
    setServerError(undefined);
    const missing = MANDATORY.filter(([name, key]) => on(name) && req(name) && String(v[key]).trim() === "");
    if (missing.length > 0) {
      missing.forEach(([name, key]) => form.setError(key, { type: "required", message: `Enter ${name}.` }));
      return;
    }
    try {
      const res = id ? await update.mutateAsync({ id, body: toInput(v, extras.customFields.map((f) => [f.id, String(f.name)])) }) : await create.mutateAsync(toInput(v, extras.customFields.map((f) => [f.id, String(f.name)])));
      toast.success(res.message);
      onDone(res.item.item_id);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Could not save the item.");
    }
  });

  if (id && existing.data?.locked) {
    return <FormShell title="Edit Item" onSubmit={() => {}} onCancel={onCancel} submitting={false} dirty={false} error="You are restricted to perform this action Edit as the record is locked."><p className="m-0 text-mute">Unlock the item to edit it.</p></FormShell>;
  }
  if (loading) return <div className="flex-1 bg-panel p-6" aria-busy="true"><div className="h-8 w-48 animate-pulse rounded bg-soft" /></div>;
  const L = lists.data;
  const p = { register, errors };

  return (
    <>
      <FormShell title={id ? "Edit Item" : "New Item"} onSubmit={onSubmit} onCancel={() => (isDirty ? setLeave(true) : onCancel())} submitting={pending} dirty={isDirty} error={serverError ?? (lists.isError ? lists.error.message : undefined)}>
        <div className="grid gap-8 min-[1100px]:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="flex flex-col gap-4">
            <Text name="name" label="Name" required {...p} />
            {on("Alias Name") && <Text name="alias" label="Alias Name" required={req("Alias Name")} {...p} />}
            <Radios name="type" label="Type" options={[["goods", "Goods"], ["service", "Service"]]} register={register} />
            {on("Category") && <Pick name="category" label="Category" placeholder="Select a category" options={L?.categories ?? []} required={req("Category")} {...p} />}
            {on("Brand") && <Pick name="brand" label="Brand" placeholder="Select or Add Brand" options={L?.brands ?? []} required={req("Brand")} {...p} />}
            {on("Manufacturer") && <Pick name="manufacturer" label="Manufacturer" placeholder="Select or Add Manufacturer" options={L?.manufacturers ?? []} required={req("Manufacturer")} {...p} />}
          </div>
          <div className="grid h-fit grid-cols-2 gap-3 rounded-xl border border-line p-4">
            <div className="flex flex-col gap-2"><span>Front View</span><button type="button" onClick={() => toast.info("Image upload is built in a later phase.")} className="grid min-h-16 cursor-pointer place-items-center rounded-md border border-dashed border-line bg-transparent text-inherit"><span className="inline-flex items-center gap-1.5"><Upload size={14} /> Upload Front Image</span></button><span>Rear View</span><button type="button" onClick={() => toast.info("Image upload is built in a later phase.")} className="grid min-h-16 cursor-pointer place-items-center rounded-md border border-dashed border-line bg-transparent text-inherit"><span className="inline-flex items-center gap-1.5"><Upload size={14} /> Upload Rear Image</span></button></div>
            <div className="flex flex-col gap-2"><span>Other Images</span><div className="grid flex-1 place-items-center rounded-md border border-dashed border-line p-3 text-center"><span><Upload size={18} className="mx-auto mb-1" /><b className="block font-medium">Drag &amp; Drop Images</b><small className="text-mute">You can add up to 15 images including front, rear and other images, each not exceeding 5 MB.</small></span></div></div>
          </div>
        </div>

        <Section title="Item Details">
          {goods && <Pick name="unit" label="Unit" required placeholder="Select or type to add" options={L?.units ?? []} {...p} />}
          {on("SKU") && <Text name="sku" label="SKU" required={req("SKU")} {...p} />}
          {(["upc", "mpn", "ean", "isbn"] as const).filter((k) => on(k.toUpperCase())).map((k) => <Text key={k} name={k} label={k.toUpperCase()} required={req(k.toUpperCase())} {...p} />)}
          <Text name="description" label="Item Description" multiline {...p} />
        </Section>

        <Section title="Sales Information">
          {on("Selling Price") && <Text name="rate" label="Selling Price" prefix="INR" required={req("Selling Price")} {...p} />}
          {on("MRP") && <Text name="mrp" label="MRP" prefix="INR" required={req("MRP")} {...p} />}
          <Pick name="salesAccount" label="Account" empty={false} options={L?.income_accounts ?? []} {...p} />
          {on("Minimum Profit Percentage") && <Text name="minProfit" label="Minimum Profit" prefix="%" required={req("Minimum Profit Percentage")} {...p} />}
          <Text name="salesDescription" label="Description" multiline {...p} />
        </Section>

        <Section title="Purchase Information">
          {on("Purchase Price") && <Text name="cost" label="Cost Price" prefix="INR" required={req("Purchase Price")} {...p} />}
          <Pick name="purchaseAccount" label="Account" empty={false} options={L?.purchase_accounts ?? []} {...p} />
          <Text name="purchaseDescription" label="Description" multiline {...p} />
          {on("Preferred Vendor") && <Pick name="vendor" label="Preferred Vendor" options={L?.vendors ?? []} required={req("Preferred Vendor")} {...p} />}
        </Section>

        {goods && settings?.inventoryEnabled !== false && (
          <Section>
            <div className="min-[1000px]:col-span-2">
              <label className="flex items-center gap-2 text-[1rem]"><input type="checkbox" disabled={!!id && !!existing.data?.tracksInventory} {...register("track")} />Track Inventory for this item</label>
              <p className="mb-0 ml-6 mt-1 text-mute">You cannot enable/disable inventory tracking once you&apos;ve created transactions for this item</p>
            </div>
            {stocked && (
              <>
                {(settings?.serialEnabled || settings?.batchEnabled) && <Radios name="tracking" label="Inventory Tracking" options={[["none", "None"], ...(settings?.serialEnabled ? ([["serial", "Serial"]] as [string, string][]) : []), ...(settings?.batchEnabled ? ([["batch", "Batch"]] as [string, string][]) : [])]} register={register} />}
                <Radios name="bin" label="Bin Location Tracking" options={[["true", "Yes"], ["false", "No"]]} register={register} />
                <span className="hidden min-[1000px]:block" />
                <Pick name="inventoryAccount" label="Inventory Account" required placeholder="Select an account" options={L?.inventory_accounts ?? []} {...p} />
                <Pick name="valuation" label="Inventory Valuation Method" required empty={false} options={L?.valuation_methods ?? []} {...p} />
                <Pick name="grniAccount" label="Goods Received Not Invoiced Account" required empty={false} options={["Accrued Purchases"]} {...p} />
                <Pick name="varianceAccount" label="Purchase Variance Account" required empty={false} options={["Purchase Price Variance"]} {...p} />
                <Text name="reorder" label="Reorder Point" {...p} />
              </>
            )}
          </Section>
        )}

        {goods && (
          <>
            <Section title="Cancellation and Returns"><Radios name="returnable" label="Returnable Item" options={[["true", "Yes"], ["false", "No"]]} register={register} /></Section>
            <Section title="Fulfilment Details">
              <Text name="dimensions" label="Dimensions" hint={`(Length X Width X Height) in ${settings?.dimensionUnit ?? "cm"}`} {...p} />
              <Text name="weight" label="Weight" prefix={settings?.weightUnit ?? "kg"} {...p} />
            </Section>
          </>
        )}
        {extras.customFields.length > 0 && (
          <Section title="Additional Information">
            {extras.customFields.map((f) => (
              <Field key={f.id} label={String(f.name)} htmlFor={`cf_${f.id}`} required={f.mandatory === true} hint={f.help_text ? String(f.help_text) : undefined}>
                <input id={`cf_${f.id}`} className={controlClass} {...register(`cf_${f.id}` as never)} />
              </Field>
            ))}
          </Section>
        )}
      </FormShell>
      <Modal title="Leave this page?" open={leave} onClose={() => setLeave(false)} size="sm" footer={<><Button variant="primary" onClick={() => { setLeave(false); onCancel(); }}>Leave</Button><Button onClick={() => setLeave(false)}>Stay</Button></>}>
        Your changes have not been saved. If you leave now they will be lost.
      </Modal>
    </>
  );
}

