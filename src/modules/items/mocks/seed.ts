import type { ItemDto, PreferencesDto } from "../api/contract";

/** Starting preferences of the mock backend (the wireframe's defaults). */
export const SEED_PREFERENCES: PreferencesDto = {
  quantity_precision: 3, dimension_unit: "cm", weight_unit: "kg", barcode_scanner_field: "SKU", default_inventory_valuation_method: "FIFO",
  is_item_name_duplication_enabled: false, is_item_autocomplete_new_search_enabled: false, can_show_lineitem_pricebook: false, is_pricing_rule_enabled: false,
  redirect_url: "", is_customer_qty_control_enabled: false, is_inventory_enabled: true, books_start_date: "2026-11-13", is_serial_number_enabled: false,
  is_batch_tracking_enabled: false, is_batch_price_enabled: false, sales_margin_percentage: 0, is_auto_batch_enabled: false, is_auto_batch_assignment_enabled: false,
  restrict_negative_available_stock: false, warning_out_of_stock: false, is_reorder_notification_enabled: false, is_landed_cost_enabled: false,
  is_replenishment_enabled: false, consider_inbound_stock_for_task_generation: false, replenishment_trigger_time: "05:00",
  is_customer_qty_control_show_error: true, default_replenishment_trigger_frequency: 1, default_replenishment_trigger_period: "days",
  additional_preferences: { serial_returns_only_sold: false, serial_restrict_sold_inward: false, batch_allow_duplicates: false, batch_returns_only_sold: false, batch_price_selection: "Default Price", batch_assignment_method: "", prevent_negative_level: "Organization level", notify_to: "", landed_cost_method: "Quantity" },
};

const BASE: Omit<ItemDto, "item_id" | "name" | "sku" | "item_type" | "product_type" | "unit" | "rate" | "purchase_rate" | "stock_on_hand" | "available_for_sale" | "reorder_level" | "track_inventory" | "is_returnable"> = {
  status: "active", description: "", purchase_description: "", committed_stock: null, category_name: "", brand: "", manufacturer: "",
  account_name: "Sales", purchase_account_name: "Cost of Goods Sold", inventory_valuation_method: "", has_variant: false, is_combo_product: false,
  fund_type: "", lock_details: null, created_time: "2026-11-13T10:00:00+05:30",
};

/** The four wireframe items (inventory, inventory, service, fund). */
const WIREFRAME: ItemDto[] = [
  { ...BASE, item_id: "1", name: "LED Panel Light 40W", sku: "LED-40W-001", item_type: "inventory", product_type: "goods", unit: "pcs", rate: 1800, purchase_rate: 1100, stock_on_hand: 130, available_for_sale: 130, reorder_level: 20, track_inventory: true, is_returnable: true, inventory_valuation_method: "FIFO" },
  { ...BASE, item_id: "2", name: "LED Driver Unit 40W", sku: "DRV-40W-001", item_type: "inventory", product_type: "goods", unit: "pcs", rate: 400, purchase_rate: 300, stock_on_hand: 0, available_for_sale: 0, reorder_level: 0, track_inventory: true, is_returnable: true, inventory_valuation_method: "FIFO" },
  { ...BASE, item_id: "3", name: "Annual Maintenance Service", sku: "", item_type: "service", product_type: "service", unit: "", rate: 12000, purchase_rate: 5000, stock_on_hand: null, available_for_sale: null, reorder_level: null, track_inventory: false, is_returnable: false },
  { ...BASE, item_id: "4", name: "Education Support Fund", sku: "", item_type: "fund", product_type: "goods", unit: "", rate: 1000, purchase_rate: 0, stock_on_hand: null, available_for_sale: null, reorder_level: null, track_inventory: false, is_returnable: false, fund_type: "Revenue" },
];

/** Deterministic extra items so lists can be checked at 2,000+ rows. */
function generated(count: number): ItemDto[] {
  const words = ["Panel", "Driver", "Cable", "Switch", "Sensor", "Bracket", "Lamp", "Relay", "Fuse", "Adapter"];
  return Array.from({ length: count }, (_, i) => {
    const n = i + 5;
    const service = i % 11 === 0;
    const stock = service ? null : (i * 7) % 300;
    return {
      ...BASE,
      item_id: String(n),
      name: `${words[i % words.length]} ${100 + (i % 900)} Series ${n}`,
      sku: service ? "" : `SKU-${String(n).padStart(5, "0")}`,
      status: i % 13 === 0 ? "inactive" : "active",
      item_type: service ? "service" : "inventory",
      product_type: service ? "service" : "goods",
      unit: service ? "" : "pcs",
      rate: 100 + ((i * 37) % 5000),
      purchase_rate: 60 + ((i * 23) % 3000),
      stock_on_hand: stock,
      available_for_sale: stock,
      reorder_level: service ? null : (i * 3) % 40,
      track_inventory: !service,
      is_returnable: i % 3 !== 0,
      inventory_valuation_method: service ? "" : "FIFO",
    } satisfies ItemDto;
  });
}

export function seedItems(extra = 2000): ItemDto[] {
  return [...WIREFRAME, ...generated(extra)];
}
