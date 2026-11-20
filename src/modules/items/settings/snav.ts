/** Settings menu groups, copied from the wireframe: section -> group -> entries. Entries without a page are shown but do nothing yet.
 *  Two vendor-named entries are renamed (Zoho Apps, Deluge Components Usage) because the product UI must not carry vendor names. */
export const SNAV: Record<string, Record<string, string[]>> = {
  "ORGANIZATION SETTINGS": {
    Organization: ["Profile", "Branding", "Designations", "Custom Domain", "Departments", "Locations", "Networking", "AI Control Center", "Manage Subscription", "Organization Preferences"],
    "Users & Roles": ["Users", "Roles", "User Preferences"],
    "Taxes & Compliance": ["Taxes", "Direct Taxes", "Payroll Tax Details", "MSME Settings", "Non Profits"],
    "Setup & Configurations": ["General", "Configure Modules", "Currencies", "Policies", "Payment Terms", "Opening Balances", "Reminders", "Customer Portal", "Pay Schedule", "Statutory Components", "Salary Components", "Claims and Declarations", "Vendor Portal", "Loyalty Program"],
    Customization: ["Hosted Payment Pages", "Transaction Number Series", "Salary Templates", "PDF Templates", "Email Notifications", "SMS Notifications", "Reporting Tags", "Web Tabs", "Digital Signature"],
    Automation: ["Workflow Rules", "Workflow Actions", "Workflow Logs", "Schedules", "Expense Report Automation"],
  },
  "MODULE SETTINGS": {
    General: ["Employees & Contractors", "Customers and Vendors", "Items", "Accounting", "Banking", "Tasks", "Projects", "Timesheet", "Employee Portal"],
    Inventory: ["Units of Measurement", "Embedded Barcodes", "Inventory Adjustments", "Packages", "Shipments"],
    "Online Payments": ["Customer Payments", "Vendor Payments", "Salary Payments"],
    Sales: ["Quotes", "Retainer Invoices", "Sales Orders", "Proforma Invoices", "Delivery Challans", "Invoices", "Donations", "Payments Received", "Sales Returns", "Credit Notes", "Delivery Notes", "Packing Slips"],
    Subscriptions: ["General", "Billing Preferences", "Dunning Management", "Cancellation Preferences"],
    Purchases: ["Expenses", "Recurring Expenses", "Purchase Requests", "Request for Quotes", "Purchase Orders", "Purchase Receives", "Purchase Returns", "Bills", "Recurring Bills", "Payments Made", "Batch Payments", "Vendor Credits"],
    Payroll: ["Pay Runs", "Salary Revisions", "Loan", "Payroll Journal Accounts"],
    "Travel & Expense": ["Categories", "Merchants", "Trips", "Expense Claims", "Expense Reports", "Advances", "Batch Payments", "Petty Cash Accounts"],
    Manufacturing: ["General", "Cost Templates", "Work Center Types", "Work Center Timings", "Work Centers", "Operations", "Bill of Materials", "Manufacturing Order", "Job Cards"],
    Quality: ["General", "Quality Rules"],
    Distribution: ["Beats", "Salespersons"],
    Retail: ["General", "Sessions", "Cash Management", "Payment Methods"],
    "Custom Modules": ["Overview", "Vehicles"],
  },
  "EXTENSION AND DEVELOPER DATA": {
    Integrations: ["Connected Apps", "WhatsApp", "SMS Integrations", "Shipping", "Shopping Cart", "eCommerce", "Sales & Marketing", "Bharat Connect"],
    "Developer Data": ["Widgets", "Incoming Webhooks", "Connections", "API Usage", "Signals", "Data Management", "Script Components Usage", "Web Forms"],
  },
};

/** The one entry that has a page today: Module Settings > General > Items. */
export const ITEMS_SETTINGS_HREF = "/setup/items";

/** Page link for a menu entry, or null when the entry has no page yet. */
export function entryHref(group: string, entry: string): string | null {
  return group === "General" && entry === "Items" ? ITEMS_SETTINGS_HREF : null;
}
