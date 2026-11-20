import type { RecordDto } from "../api/resources";
import type { Store } from "./collections";

const T = "2026-11-13T10:00:00+05:30";
const rec = (r: Record<string, unknown> & { id: string }): RecordDto => ({ status: "active", created_time: T, ...r });

/** Built-in item fields (name, data type, which row-menu actions exist). Custom fields are added by the user. */
const STD_FIELDS: [string, string, string][] = [
  ["SKU", "Text Box (Single Line)", "sku"], ["Brand", "Text Box (Single Line)", "std3"], ["Manufacturer", "Text Box (Single Line)", "std3"], ["Preferred Vendor", "Lookup", "std3"],
  ["Selling Price", "Decimal", "cfg"], ["Purchase Price", "Decimal", "cfg"], ["Minimum Profit Percentage", "Decimal", "inact"], ["Image", "Text Box (Single Line)", "img"],
  ["Category", "Text Box (Single Line)", "inact"], ["MRP", "Decimal", "mrp"], ["Alias Name", "Text Box (Single Line)", "inact"],
  ["UPC", "Text Box (Single Line)", "cus"], ["MPN", "Text Box (Single Line)", "cus"], ["EAN", "Text Box (Single Line)", "cus"], ["ISBN", "Text Box (Single Line)", "cus"], ["Fund Type", "Dropdown", "none"],
];

/** Starting data of every secondary resource in the mock backend (business data follows the wireframe's sample data). */
export function seedCollections(): Store {
  return {
    composite: [rec({ id: "1", name: "LED Panel Kit", sku: "KIT-LED-01", type: "Kit", rate: 2100, stock: 40, reorder: 10, unit: "pcs", items: [{ name: "LED Panel Light 40W", quantity: 1, rate: 1800 }, { name: "LED Driver Unit 40W", quantity: 1, rate: 400 }] })],
    bom: [rec({ id: "1", name: "LED Panel Assembly", number: "BOM-00001", item_to_produce: "LED Panel Light 40W", quantity: 1, unit: "pcs", description: "Standard assembly of the 40W panel",
      components: [{ name: "LED Driver Unit 40W", quantity: 1, scrap: 2, unit: "pcs" }],
      operations: [{ name: "Assembly", instructions: "Fit the driver into the housing", work_center_type: "Assembly Line", duration: "10:00", blocked_by: "", attachment: "" }],
      manufacturing_orders: [{ number: "MO-00001", reference: "REF-0001", status: "Completed" }, { number: "MO-00002", reference: "REF-0002", status: "Draft" }] })],
    plans: [
      rec({ id: "1", name: "Starter Monthly", product: "BOSS Cloud Suite", code: "BCS-START-M", model: "Unit", frequency: "1 month(s)", price: 500, unit_name: "unit", trial_days: 0, setup_fee: 0, plan_account: "Sales" }),
      rec({ id: "2", name: "Growth Yearly", product: "BOSS Cloud Suite", code: "BCS-GROW-Y", model: "Unit", frequency: "12 month(s)", price: 5400, unit_name: "unit", trial_days: 14, setup_fee: 0, plan_account: "Sales" }),
      rec({ id: "3", name: "Desk Basic", product: "BOSS Support Desk", code: "BSD-BASIC", model: "Unit", frequency: "1 month(s)", price: 300, unit_name: "unit", trial_days: 0, setup_fee: 0, plan_account: "Sales", status: "inactive" }),
    ],
    addons: [
      rec({ id: "1", name: "Extra Storage 100GB", product: "BOSS Cloud Suite", code: "BCS-STORE", type: "Recurring", model: "Unit", frequency: "Monthly", plans: "All Plans", price: 200, addon_account: "Sales" }),
      rec({ id: "2", name: "Onboarding Setup", product: "BOSS Cloud Suite", code: "BCS-ONB", type: "One Time", model: "Unit", frequency: "-", plans: "All Plans", price: 1500, addon_account: "Sales" }),
    ],
    products: [
      rec({ id: "1", name: "BOSS Cloud Suite", description: "All-in-one business software subscription" }),
      rec({ id: "2", name: "BOSS Support Desk", description: "Helpdesk and ticketing" }),
      rec({ id: "3", name: "BOSS Analytics Pro", description: "Dashboards and reports", status: "inactive" }),
    ],
    pricelists: [rec({ id: "1", name: "Dealer Price List", description: "10% below list for dealers", currency: "INR", transaction_type: "Sales", scheme: "All Items", details: "Mark down sales rate by 10 %", percentage: 10, round_off: "Never mind" })],
    widgets: [],
    coupons: [rec({ id: "1", name: "Welcome 10", code: "WELCOME10", discount_by: "Percentage", discount_value: 10, type: "One Time", max_redemption: 100, valid_upto: "2027-03-31", product_scope: "All Products", expired: false })],
    fields: STD_FIELDS.map(([name, data_type, menu], i) => rec({ id: String(i + 1), name, data_type, menu, std: true, mandatory: false, show_in_pdf: false, access: {} })),
    rules: [],
    locks: [],
    buttons: [],
    related: [],
  };
}
