import type { ResourceName } from "../api/resources";
import type { ColumnDef, FieldDef, SectionDef } from "../features/records/types";

/** Item fields a validation rule can look at (names as the ERP lists them). */
export const RULE_FIELDS = ["Item", "Item ID", "Item Name", "Selling Price", "Cost Price", "Sales Account", "Purchase Account", "Sales Description", "Purchase Description", "Unit", "SKU", "Inventory Account", "Opening Stock", "Opening Stock Value", "Category", "Preferred Vendor", "Fund Type", "Users", "User Role"];

/** The 24 data types of a custom field, and how many of each can still be created (from the wireframe's capture). */
export const FIELD_TYPES = ["Text Box (Single Line)", "Email", "URL", "Phone", "Number", "Decimal", "Amount", "Percent", "Date", "Date and Time", "Check Box", "Auto-Generate Number", "Dropdown", "Multi-select", "Lookup", "Text Box (Multi-line)", "Attachment", "Formula", "External Lookup", "Multi-select Lookup", "Image", "Keyword Extraction", "Image To Text", "Sentiment Analysis"];
export const FIELD_REMAINING: Record<string, number> = { Number: 35, Decimal: 20, Amount: 20, Percent: 20, "Check Box": 20, Dropdown: 24, "Multi-select": 5, Lookup: 5, "Text Box (Multi-line)": 5, Date: 35, "Auto-Generate Number": 1, Formula: 3, Attachment: 10 };

/** The 23 roles of the Configure Access dialog. */
export const ROLES = ["Admin", "Employee", "Employee (Payroll Only)", "Employee (Submitter)", "Accountant", "Accounts Payable Manager", "Accounts Receivable Manager", "Procurement Manager", "Quality Engineer", "Quality Manager", "TimesheetStaff", "Warehouse Manager", "Warehouse Staff", "Distribution Admin", "Sales Person", "Manufacturing Manager", "Shopfloor Staff", "Payroll Manager", "Retail Manager", "Retail Staff", "Travel and Expense Manager", "Donations Staff", "Production Planner"];

const t = (key: string, label: string, o: Partial<FieldDef> = {}): FieldDef => ({ key, label, kind: "text", ...o });
const sel = (key: string, label: string, options: string[], o: Partial<FieldDef> = {}): FieldDef => ({ key, label, kind: "select", options, ...o });
const rad = (key: string, label: string, options: string[]): FieldDef => ({ key, label, kind: "radio", options, required: true });
const col = (key: string, label: string, o: Partial<ColumnDef> = {}): ColumnDef => ({ key, label, ...o });

/** One of the four list tabs of Items settings. Each is data: the list columns, the empty text, and the form. */
export type SettingsList = {
  resource: ResourceName;
  tab: string;
  singular: string;
  newLabel: string;
  empty: { title?: string; text: string };
  columns: ColumnDef[];
  sections: SectionDef[];
  /** Lock configurations and buttons are small dialogs; rules and related lists are pages. */
  variant: "page" | "modal";
  defaults?: Record<string, unknown>;
};

export const SETTINGS_LISTS: SettingsList[] = [
  {
    resource: "rules", tab: "Validation Rules", singular: "Validation Rule", newLabel: "+ New Validation Rule", variant: "page",
    empty: { title: "Create Validation Rules", text: "Validation Rules helps you to validate the data entered while creating, editing, or converting transactions and to prevent users from performing specific actions." },
    columns: [col("name", "Rule Name"), col("when", "When"), col("message", "Alert Message"), col("status", "Status", { badge: true })],
    sections: [
      { fields: [t("name", "Validation Rule Name", { required: true, max: 100 })] },
      { title: "WHEN", fields: [sel("field", "Field", RULE_FIELDS, { required: true }), sel("comparator", "Comparator", ["is", "is not", "contains", "greater than", "less than"], { required: true }), t("value", "Value", { required: true })] },
      { title: "Then show this alert", fields: [{ key: "message", label: "Alert Message", kind: "textarea", required: true, max: 250 }] },
    ],
    defaults: { comparator: "is" },
  },
  {
    resource: "locks", tab: "Record Locking", singular: "Lock Configuration", newLabel: "+ New Lock Configuration", variant: "modal",
    empty: { title: "Record Locking", text: "Record Locking helps you control updates to records. You can specify which actions and field updates to allow or restrict after records are locked, and choose who can perform these actions. This is useful for protecting important information and preventing accidental changes." },
    columns: [col("name", "Lock Configuration Name"), col("description", "Description"), col("actions", "Allow Or Restrict Actions"), col("lock_for", "Lock Records For"), col("status", "Status", { badge: true })],
    sections: [{ fields: [t("name", "Lock Configuration Name", { required: true, max: 100 }), { key: "description", label: "Description", kind: "textarea", max: 250 },
      sel("actions", "Allow or Restrict Actions", ["Restrict Edit", "Restrict Delete", "Restrict Edit and Delete", "Restrict all actions"], { required: true }), rad("lock_for", "Lock Records For", ["All Roles", "All Roles Except"])] }],
    defaults: { actions: "Restrict Edit", lock_for: "All Roles" },
  },
  {
    resource: "buttons", tab: "Buttons", singular: "Button", newLabel: "+ New Button", variant: "modal",
    empty: { text: "Create buttons which perform actions set by you. What are you waiting for!" },
    columns: [col("name", "Button Name"), col("access", "Access Permission"), col("location", "Location"), col("status", "Status", { badge: true })],
    sections: [{ fields: [t("name", "Button Name", { required: true, max: 100 }), sel("action_type", "Action Type", ["Open a URL", "Run a function", "Send a webhook"], { required: true }),
      sel("location", "Location", ["Details Page Menu", "List Page - Action Menu", "List Page - Bulk Action Menu"], { required: true })] }],
    defaults: { action_type: "Open a URL", location: "Details Page Menu", access: "Only Me" },
  },
  {
    resource: "related", tab: "Related Lists", singular: "Related List", newLabel: "+ New Related List", variant: "page",
    empty: { text: "Create custom related lists to access relevant information available from inside or outside the application." },
    columns: [col("name", "Related List Name"), col("access", "Access Permission"), col("status", "Status", { badge: true })],
    sections: [{ fields: [t("name", "Related List Name", { required: true, max: 100 }), { key: "code", label: "Code", kind: "textarea", required: true, max: 2000 }, rad("access", "View Access", ["Only Me", "All Users"])] }],
    defaults: { access: "Only Me" },
  },
];
