"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/shared/ui/Card";
import { DropdownMenu } from "@/shared/ui/DropdownMenu";
import { TrendChart } from "@/shared/ui/TrendChart";

/** Periods of the "Sales Order Summary" filter (the ERP's `SalesOrderDate.<Period>` filters). */
const PERIODS = ["Today", "Yesterday", "This Week", "Previous Week", "This Month", "Previous Month", "This Quarter", "Previous Quarter", "This Year", "Previous Year"];
const Y_LABELS = ["5 K", "4 K", "3 K", "2 K", "1 K", "0"];

/**
 * Item overview card: sales order totals for the chosen period, with the period menu, an axis grid and a Total Sales key.
 * Drawn with the shared TrendChart. There is no sales summary call in the API contract yet, so it always shows "No data found." (never made-up numbers).
 * Must not fetch; when the contract gains the call, pass its points in.
 */
export function SalesSummary() {
  const [period, setPeriod] = useState("This Month");
  return (
    <Card variant="group" className="!p-0">
      <div className="flex items-center rounded-t-xl border-b border-line bg-soft px-5 py-3">
        <h3 className="m-0 flex-1 text-[0.9375rem] font-normal">Sales Order Summary (In INR)</h3>
        <DropdownMenu dense align="right" triggerLabel="Choose period" width={200}
          trigger={<span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-panel">{period}<ChevronDown size={14} /></span>}
          groups={[{ items: PERIODS.map((p) => ({ id: p, label: p, checked: p === period, onSelect: () => setPeriod(p) })) }]} />
      </div>
      <div className="flex flex-wrap items-end gap-6 p-5">
        <div className="min-w-0 flex-1 basis-72"><TrendChart points={[]} yLabels={Y_LABELS} height={256} /></div>
        <div className="min-w-36 border-l-[3px] border-link bg-soft px-4 py-2"><div className="text-[0.75rem] uppercase text-link">Total Sales</div><div className="mt-1 text-[1.25rem] text-link">₹0.00</div></div>
      </div>
    </Card>
  );
}
