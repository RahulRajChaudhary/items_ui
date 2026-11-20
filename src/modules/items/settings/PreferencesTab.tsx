"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/Button";
import { controlClass } from "@/shared/ui/Field";
import type { AdditionalPreferences, PreferencesDto } from "../api/contract";
import { usePreferences, useSavePreferences } from "./usePreferences";

type BoolKey = { [K in keyof PreferencesDto]: PreferencesDto[K] extends boolean ? K : never }[keyof PreferencesDto];
type SubBool = { [K in keyof AdditionalPreferences]: AdditionalPreferences[K] extends boolean ? K : never }[keyof AdditionalPreferences];

/**
 * Items settings > Preferences. Edits a draft copy of the server's full preferences object; Save sends the whole object
 * (never a partial one) and Cancel restores the saved values. If the server refuses a change (for example turning
 * inventory tracking off while stock exists), its sentence is shown in a banner and the screen goes back to the saved
 * values. Sub-options of a switch that is off are kept and sent unchanged. Must not read raw preferences anywhere else.
 */
export function PreferencesTab() {
  const q = usePreferences();
  const save = useSavePreferences();
  const [d, setD] = useState<PreferencesDto | null>(null);
  const [error, setError] = useState<string>();
  useEffect(() => { if (q.data) setD(structuredClone(q.data)); }, [q.data]);

  if (q.isError) return <div className="p-5"><Banner tone="error">{q.error.message} <Button compact onClick={() => q.refetch()}>Retry</Button></Banner></div>;
  if (!d || !q.data) return <div className="p-5" aria-busy="true"><div className="h-40 animate-pulse rounded-md bg-soft" /></div>;

  const set = <K extends keyof PreferencesDto>(k: K, v: PreferencesDto[K]) => setD({ ...d, [k]: v });
  const sub = <K extends keyof AdditionalPreferences>(k: K, v: AdditionalPreferences[K]) => setD({ ...d, additional_preferences: { ...d.additional_preferences, [k]: v } });
  const a = d.additional_preferences;
  const dirty = JSON.stringify(d) !== JSON.stringify(q.data);

  const onSave = async () => {
    setError(undefined);
    try {
      const r = await save.mutateAsync(d);
      toast.success(r.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the preferences.");
      setD(structuredClone(q.data));
    }
  };

  const sw = (k: BoolKey, label: string, desc?: string) => (
    <label className="flex items-start gap-2 py-1.5 text-[0.8125rem]"><input type="checkbox" className="mt-[3px]" checked={d[k]} onChange={(e) => set(k, e.target.checked as PreferencesDto[typeof k])} /><span>{label}{desc && <small className="block text-mute">{desc}</small>}</span></label>
  );
  const subSw = (k: SubBool, label: string, desc?: string) => (
    <label className="flex items-start gap-2 py-1.5 text-[0.8125rem]"><input type="checkbox" className="mt-[3px]" checked={a[k]} onChange={(e) => sub(k, e.target.checked as AdditionalPreferences[typeof k])} /><span>{label}{desc && <small className="block text-mute">{desc}</small>}</span></label>
  );
  const select = (value: string, opts: string[], label: string, onChange: (v: string) => void) => (
    <select aria-label={label} className={controlClass} value={value} onChange={(e) => onChange(e.target.value)}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
  );
  const row = (label: ReactNode, control: ReactNode) => <div className="grid max-w-[700px] grid-cols-[minmax(0,1fr)_145px] items-center gap-2.5 py-2"><span>{label}</span>{control}</div>;
  const box = (children: ReactNode) => <div className="my-1.5 ml-[26px] border-l-[3px] border-line bg-soft px-3 py-2">{children}</div>;
  const callout = (children: ReactNode) => <div className="my-1.5 flex items-center gap-2 rounded-md bg-callout px-3 py-2">{children}</div>;
  const section = (title: string | null, children: ReactNode, desc?: string) => (
    <section className="max-w-[1100px] border-b border-line px-5 py-5">
      {title && <h3 className="m-0 mb-1.5 text-[1rem] font-normal">{title}</h3>}
      {desc && <p className="mb-2 mt-0.5 text-mute">{desc}</p>}
      {children}
    </section>
  );
  const info = <Info size={12} className="inline text-mute" aria-hidden />;
  const tracked = (
    <>
      <div className="my-1.5 text-[0.8125rem]">Tracked in: <b className="font-medium">Packages, Purchase Receives &amp; Return Receipts</b></div>
      <div className="my-1.5 text-[0.8125rem]">Mandatory? <b className="font-medium">Yes</b> <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-link hover:underline" onClick={() => toast.info("This dialog is built in a later phase.")}>Configure</button></div>
    </>
  );

  return (
    <>
      <div className="min-h-0 flex-1 overflow-auto">
        {error && <div className="px-5 pt-4"><Banner tone="error" onDismiss={() => setError(undefined)}>{error}</Banner></div>}
        {section(null, <>
          {row("Set a decimal rate for your item quantity", select(String(d.quantity_precision), ["0", "1", "2", "3", "4", "5", "6"], "Decimal places", (v) => set("quantity_precision", Number(v))))}
          {row(<>Measure dimensions in: {info}</>, select(d.dimension_unit, ["in", "cm", "mm"], "Dimensions unit", (v) => set("dimension_unit", v as PreferencesDto["dimension_unit"])))}
          {row(<>Measure weights in: {info}</>, select(d.weight_unit, ["lb", "kg", "g", "oz"], "Weight unit", (v) => set("weight_unit", v as PreferencesDto["weight_unit"])))}
          {row(<>Select items when barcodes are scanned using: {info}</>, select(d.barcode_scanner_field, ["SKU", "ISBN", "UPC", "EAN"], "Barcode field", (v) => set("barcode_scanner_field", v as PreferencesDto["barcode_scanner_field"])))}
        </>)}
        {section("Default Inventory Valuation Method", (
          <div className="grid max-w-[700px] grid-cols-[minmax(0,1fr)_330px] items-center gap-2.5 py-2"><span>Inventory Valuation Method</span>
            <select aria-label="Valuation method" className={controlClass} value={d.default_inventory_valuation_method} onChange={(e) => set("default_inventory_valuation_method", e.target.value as "FIFO" | "WAC")}><option value="FIFO">FIFO (First In, First Out)</option><option value="WAC">Weighted Average Cost (Moving Average)</option></select></div>
        ), "This valuation method will be used by default when creating items, variants and composite items.")}
        {section("Duplicate Item Name", <>{sw("is_item_name_duplication_enabled", "Allow duplicate item names", "If you allow duplicate item names, all imports involving items will use SKU as the primary field for mapping.")}{callout(<>Before you enable this option, make the SKU field active and mandatory.</>)}</>)}
        {section("Enhanced Item Search", <>{sw("is_item_autocomplete_new_search_enabled", "Enable Enhanced Item Search")}{callout(<>{info} Enabling this option makes it easier to find any item using relevant keywords in any order.</>)}</>)}
        {section("Price Lists", <>{sw("can_show_lineitem_pricebook", "Apply price list at line item level", "Select this option if you want to apply different price lists for each line item.")}{sw("is_pricing_rule_enabled", "Enable Pricing Rule", "Pricing Rule allows you to create price lists that will be applied to items based on the pricing rules you configure.")}</>)}
        {section("Redirection URL", <input type="text" aria-label="Redirection URL" className={`${controlClass} max-w-[420px]`} value={d.redirect_url} onChange={(e) => set("redirect_url", e.target.value)} />, "Send customers to a specific URL after they complete a purchase. Helpful for creating a seamless post-purchase experience like onboarding or confirmation.")}
        {section("Quantity Limit", <>
          {sw("is_customer_qty_control_enabled", "Enable Quantity Limit")}
          {d.is_customer_qty_control_enabled && box(<>
            What do you want to do when the quantity limit has been exceeded?
            {([[true, "Restrict creating or updating transactions"], [false, "Show a warning and allow users to proceed"]] as const).map(([v, l]) => (
              <label key={l} className="flex items-start gap-2 py-1.5 text-[0.8125rem]"><input type="radio" name="qa" className="mt-[3px]" checked={d.is_customer_qty_control_show_error === v} onChange={() => set("is_customer_qty_control_show_error", v)} />{l}</label>
            ))}
          </>)}
        </>, "Quantity Limit lets you set a limit of the maximum quantity of items that can be included in a sales transaction.")}
        {section("Inventory", <>
          {sw("is_inventory_enabled", "Enable Inventory Tracking")}
          <div className="ml-[26px] grid max-w-[400px] grid-cols-[200px_200px] items-center gap-2.5 py-2"><span className="after:ml-0.5 after:text-bad after:content-['*']">Inventory Start Date</span><input type="date" aria-label="Inventory Start Date" className={controlClass} value={d.books_start_date} onChange={(e) => set("books_start_date", e.target.value)} /></div>
          <h3 className="mb-1.5 mt-4 text-[1rem] font-normal">Advanced Inventory Tracking</h3>
          {sw("is_serial_number_enabled", "Enable Serial Number Tracking")}
          {d.is_serial_number_enabled && box(<>{subSw("serial_returns_only_sold", "Allow returns only for sold serial numbers")}{subSw("serial_restrict_sold_inward", "Restrict already sold serial numbers in inward transactions")}{tracked}</>)}
          {sw("is_batch_tracking_enabled", "Enable Batch Tracking")}
          {d.is_batch_tracking_enabled && box(<>
            {subSw("batch_allow_duplicates", "Allow duplicate batch numbers")}
            {subSw("batch_returns_only_sold", "Allow returns only to the sold batch")}
            {sw("is_batch_price_enabled", "Allow different MRP/Selling price for each Batch Tracked Items")}
            {d.is_batch_price_enabled && box(<div className="grid max-w-[440px] grid-cols-2 gap-2.5">
              <label className="flex flex-col gap-1 text-[0.6875rem] text-mute">Sales Margin<span className="flex items-center gap-1.5"><input type="number" className={controlClass} value={d.sales_margin_percentage} onChange={(e) => set("sales_margin_percentage", Number(e.target.value))} /> %</span></label>
              <label className="flex flex-col gap-1 text-[0.6875rem] text-mute">Price Selection{select(a.batch_price_selection, ["Default Price", "Latest Price", "Highest Price"], "Price selection", (v) => sub("batch_price_selection", v as AdditionalPreferences["batch_price_selection"]))}</label>
            </div>)}
            {sw("is_auto_batch_enabled", "Auto-Generate Batch Numbers", "Configure auto-generation of batch numbers to automatically generate them for inward transactions.")}
            {d.is_auto_batch_enabled && box(<><Button onClick={() => toast.info("This dialog is built in a later phase.")}>View Batch Numbers Configuration</Button><p className="mb-0 mt-2 text-[0.71875rem] text-mute">To override the existing batch numbers and configure a new one for individual items, navigate to Items &gt; Item Details &gt; Batches &gt; Click the Gear icon &gt; Click Configure Batch Numbers.</p></>)}
            {sw("is_auto_batch_assignment_enabled", "Auto Batch Assignment", "Automatically assigns batches based on the selected method for outward transactions.")}
            {d.is_auto_batch_assignment_enabled && box(<label className="flex flex-col gap-1 text-[0.6875rem] text-mute"><span className="after:ml-0.5 after:text-bad after:content-['*']">Select a batch assignment method</span>
              <select className={controlClass} value={a.batch_assignment_method} onChange={(e) => sub("batch_assignment_method", e.target.value as AdditionalPreferences["batch_assignment_method"])}><option value="">Select a batch assignment method</option><option value="FIFO">FIFO (First In, First Out)</option><option value="FEFO">FEFO (First Expiry, First Out)</option><option value="LIFO">LIFO (Last In, First Out)</option></select></label>)}
            {tracked}
          </>)}
          {sw("restrict_negative_available_stock", "Prevent stock from going below zero")}
          {d.restrict_negative_available_stock && box(["Organization level", "Location level"].map((v) => <label key={v} className="flex items-start gap-2 py-1.5 text-[0.8125rem]"><input type="radio" name="pl" className="mt-[3px]" checked={a.prevent_negative_level === v} onChange={() => sub("prevent_negative_level", v as AdditionalPreferences["prevent_negative_level"])} />{v}</label>))}
          {sw("warning_out_of_stock", "Show an Out of Stock warning when an item's stock drops below zero")}
          {sw("is_reorder_notification_enabled", "Notify me if an item's stock reaches its reorder level to replenish")}
          {d.is_reorder_notification_enabled && box(<label className="flex flex-col gap-1 text-[0.6875rem] text-mute">Notify to<input type="text" className={controlClass} placeholder="Email address" value={a.notify_to} onChange={(e) => sub("notify_to", e.target.value)} /></label>)}
          {sw("is_landed_cost_enabled", "Track landed cost on items")}
          {d.is_landed_cost_enabled && box(<><b>Default Landed Cost Allocation Method</b><p className="my-1 text-[0.71875rem] text-mute">The default allocation method to be used while allocating landed costs.</p><label className="flex max-w-[260px] flex-col gap-1 text-[0.6875rem] text-mute">Allocation Method{select(a.landed_cost_method, ["Quantity", "Value", "Dimensions", "Weight"], "Allocation method", (v) => sub("landed_cost_method", v as AdditionalPreferences["landed_cost_method"]))}</label></>)}
        </>)}
        {section("Replenishments", <>
          <div className="grid max-w-[520px] grid-cols-2 gap-2.5">
            <label className="flex flex-col gap-1 text-[0.6875rem] text-mute">Every<span className="flex gap-1"><input type="number" min={1} className={controlClass} value={d.default_replenishment_trigger_frequency} onChange={(e) => set("default_replenishment_trigger_frequency", Number(e.target.value))} /><select aria-label="Unit" className={controlClass} value={d.default_replenishment_trigger_period} onChange={(e) => set("default_replenishment_trigger_period", e.target.value as "days" | "weeks")}><option value="days">Days</option><option value="weeks">Weeks</option></select></span></label>
            <label className="flex flex-col gap-1 text-[0.6875rem] text-mute">Schedule at<input type="text" className={controlClass} value={d.replenishment_trigger_time} onChange={(e) => set("replenishment_trigger_time", e.target.value)} /></label>
          </div>
          {sw("consider_inbound_stock_for_task_generation", "Include Yet to Receive and In Transit stock when calculating replenishment quantities.", "Replenishment quantities will be calculated using Available for Sale, Yet to Receive, and In Transit stock.")}
        </>, "Select how frequently you would like to replenish the stock")}
      </div>
      <div className="sticky bottom-0 flex flex-none gap-2 border-t border-line bg-panel px-[18px] py-2.5">
        <Button variant="primary" disabled={save.isPending || !dirty} onClick={onSave}>Save</Button>
        <Button disabled={!dirty} onClick={() => { setError(undefined); setD(structuredClone(q.data)); }}>Cancel</Button>
      </div>
    </>
  );
}
