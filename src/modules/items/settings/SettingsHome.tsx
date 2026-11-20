import { Building2, Cog, Database, LayoutGrid, Palette, Plug, ReceiptText, Users, Workflow, type LucideIcon } from "lucide-react";
import { Card, CardItem } from "@/shared/ui/Card";
import { SNAV, entryHref } from "./snav";

/** Icon per group card; groups without an entry here use the generic grid icon. */
const GROUP_ICONS: Record<string, LucideIcon> = {
  Organization: Building2, "Users & Roles": Users, "Taxes & Compliance": ReceiptText, "Setup & Configurations": Cog,
  Customization: Palette, Automation: Workflow, Integrations: Plug, "Developer Data": Database,
};

/** Header tint per group: one of the layout's chart colors, picked by position so neighbours differ. */
const TINTS = ["var(--chart-2)", "var(--chart-4)", "var(--chart-1)", "var(--chart-3)", "var(--chart-5)", "var(--chart-6)"];
function tint(group: string): string {
  const all = Object.values(SNAV).flatMap((g) => Object.keys(g));
  return TINTS[Math.max(0, all.indexOf(group)) % TINTS.length] ?? "var(--chart-1)";
}

/** Cell layout per section, read from the ERP in row order across five columns. A cell is one card, or two cards
 *  stacked (Inventory + Online Payments, Users & Roles + Taxes & Compliance). The grid stretches every cell to its row's height. */
const CELLS: Record<string, string[][]> = {
  "ORGANIZATION SETTINGS": [["Organization"], ["Users & Roles", "Taxes & Compliance"], ["Setup & Configurations"], ["Customization"], ["Automation"]],
  "MODULE SETTINGS": [
    ["General"], ["Inventory", "Online Payments"], ["Sales"], ["Subscriptions"], ["Purchases"],
    ["Payroll"], ["Travel & Expense"], ["Manufacturing"], ["Quality"], ["Distribution"],
    ["Retail"], ["Custom Modules"],
  ],
  "EXTENSION AND DEVELOPER DATA": [["Integrations"], ["Developer Data"]],
};

/** "ORGANIZATION SETTINGS" -> "Organization Settings" for the panel titles. */
function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Settings home like the ERP: a grey page with one panel per section and one group card per group, all built from
 * the single shared Card. Cards in a row share the row height, so bottoms line up like the ERP.
 * Entries with a page are links; the rest are inert for now.
 */
export function SettingsHome() {
  return (
    <div className="flex-1 overflow-auto bg-soft p-4">
      <div className="flex flex-col gap-4">
        {Object.entries(SNAV).map(([section, groups]) => (
          <Card key={section} variant="panel" title={titleCase(section)}>
            <div className="grid grid-cols-1 items-stretch gap-4 min-[700px]:grid-cols-2 min-[1000px]:grid-cols-3 min-[1300px]:grid-cols-5">
              {(CELLS[section] ?? Object.keys(groups).map((g) => [g])).map((col) => (
                <div key={col.join()} className="flex flex-col gap-4">
                  {col.map((group) => {
                    const Icon = GROUP_ICONS[group] ?? LayoutGrid;
                    return (
                      <Card key={group} title={group} icon={<Icon size={16} />} tint={tint(group)} grow hoverable>
                        {(groups[group] ?? []).map((e) => <CardItem key={e} href={entryHref(group, e)}>{e}</CardItem>)}
                      </Card>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
