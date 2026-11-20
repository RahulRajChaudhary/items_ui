import type { Item, ItemSettings, Page } from "../domain/types";
import type { ItemDto, PageContext, PreferencesDto } from "./contract";

/** API item -> domain item. The only place that knows API field names for items. */
export function toItem(d: ItemDto): Item {
  return {
    id: d.item_id, name: d.name, sku: d.sku, active: d.status === "active", type: d.item_type, isService: d.product_type === "service",
    unit: d.unit, sellingPrice: d.rate, costPrice: d.purchase_rate, description: d.description, purchaseDescription: d.purchase_description,
    stockOnHand: d.stock_on_hand, availableForSale: d.available_for_sale, committed: d.committed_stock, reorderLevel: d.reorder_level,
    tracksInventory: d.track_inventory, returnable: d.is_returnable, category: d.category_name, brand: d.brand, manufacturer: d.manufacturer,
    salesAccount: d.account_name, purchaseAccount: d.purchase_account_name, valuationMethod: d.inventory_valuation_method,
    fundType: d.fund_type, tracking: d.tracking_type ?? "none", locked: !!d.lock_details?.locked, createdAt: d.created_time,
  };
}

export function toPage(items: ItemDto[], ctx: PageContext): Page<Item> {
  return { rows: items.map(toItem), page: ctx.page, perPage: ctx.per_page, total: ctx.total ?? items.length, hasMore: ctx.has_more_page };
}

/** API preferences -> the settings screens read. */
export function toSettings(p: PreferencesDto): ItemSettings {
  return {
    quantityDecimals: p.quantity_precision, dimensionUnit: p.dimension_unit, weightUnit: p.weight_unit, barcodeField: p.barcode_scanner_field,
    defaultValuation: p.default_inventory_valuation_method, allowDuplicateNames: p.is_item_name_duplication_enabled, inventoryEnabled: p.is_inventory_enabled,
    serialEnabled: p.is_serial_number_enabled, batchEnabled: p.is_batch_tracking_enabled, reorderNotification: p.is_reorder_notification_enabled,
  };
}
