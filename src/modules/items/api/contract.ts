/**
 * API contract of the Items module: the single source of truth for requests, responses and errors.
 * Written from the observed ERP calls (see handoff brief section 9). The mock server and the real backend
 * must both follow it. Endpoints marked `unverified` were inferred and must be checked before relying on them.
 */

/** Success envelope: `code` 0 plus the entity or list fields. */
export type ApiOk<T> = { code: 0; message: string } & T;

/** Failure body, sent with HTTP 400 or 404. */
export type ApiErrorBody = { code: number; message: string };

/** Error codes the UI reacts to. Any other code is shown as its server sentence. */
export const ERROR_CODES = {
  invalidValue: 2,
  notFound: 5,
  invalidElement: 8,
  tooLong: 15,
  skuMandatoryForDuplicates: 2900,
  serialInUse: 9168,
  validationRule: 1070673,
} as const;

export type PageContext = {
  page: number;
  per_page: number;
  has_more_page: boolean;
  applied_filter: string;
  sort_column: string;
  sort_order: "A" | "D";
  total?: number;
};

/** Row of the items list and detail. Fields follow the observed list/detail keys; numbers are raw, never formatted strings. */
export type ItemDto = {
  item_id: string;
  name: string;
  sku: string;
  status: "active" | "inactive";
  item_type: "inventory" | "sales" | "purchases" | "service" | "fund";
  product_type: "goods" | "service";
  unit: string;
  rate: number;
  purchase_rate: number;
  description: string;
  purchase_description: string;
  stock_on_hand: number | null;
  available_for_sale: number | null;
  committed_stock: number | null;
  reorder_level: number | null;
  track_inventory: boolean;
  is_returnable: boolean;
  category_name: string;
  brand: string;
  manufacturer: string;
  account_name: string;
  purchase_account_name: string;
  inventory_valuation_method: "FIFO" | "WAC" | "";
  has_variant: boolean;
  is_combo_product: boolean;
  fund_type: string;
  lock_details: { locked: boolean } | null;
  created_time: string;
  alias_name?: string;
  upc?: string;
  ean?: string;
  mpn?: string;
  isbn?: string;
  weight?: string;
  dimensions?: string;
  mrp?: number | null;
  min_profit_percent?: number | null;
  vendor?: string;
  inventory_account?: string;
  bin_tracking?: boolean;
  tracking_type?: "none" | "serial" | "batch";
  custom_fields?: Record<string, string>;
};

/** Full preferences object. A save must always send every key (a partial save is refused with code 8). */
export type PreferencesDto = {
  quantity_precision: number;
  dimension_unit: "in" | "cm" | "mm";
  weight_unit: "lb" | "kg" | "g" | "oz";
  barcode_scanner_field: "SKU" | "ISBN" | "UPC" | "EAN";
  default_inventory_valuation_method: "FIFO" | "WAC";
  is_item_name_duplication_enabled: boolean;
  is_item_autocomplete_new_search_enabled: boolean;
  can_show_lineitem_pricebook: boolean;
  is_pricing_rule_enabled: boolean;
  redirect_url: string;
  is_customer_qty_control_enabled: boolean;
  is_inventory_enabled: boolean;
  books_start_date: string;
  is_serial_number_enabled: boolean;
  is_batch_tracking_enabled: boolean;
  is_batch_price_enabled: boolean;
  sales_margin_percentage: number;
  is_auto_batch_enabled: boolean;
  is_auto_batch_assignment_enabled: boolean;
  restrict_negative_available_stock: boolean;
  warning_out_of_stock: boolean;
  is_reorder_notification_enabled: boolean;
  is_landed_cost_enabled: boolean;
  is_replenishment_enabled: boolean;
  consider_inbound_stock_for_task_generation: boolean;
  replenishment_trigger_time: string;
  is_customer_qty_control_show_error: boolean;
  default_replenishment_trigger_frequency: number;
  default_replenishment_trigger_period: "days" | "weeks";
  /** Sub-options of serial, batch, stock and landed-cost switches. UNVERIFIED grouping: the ERP keeps them in `additional_preferences`. Always sent unchanged when their parent is off. */
  additional_preferences: AdditionalPreferences;
};

export type AdditionalPreferences = {
  serial_returns_only_sold: boolean;
  serial_restrict_sold_inward: boolean;
  batch_allow_duplicates: boolean;
  batch_returns_only_sold: boolean;
  batch_price_selection: "Default Price" | "Latest Price" | "Highest Price";
  batch_assignment_method: "" | "FIFO" | "FEFO" | "LIFO";
  prevent_negative_level: "Organization level" | "Location level";
  notify_to: string;
  landed_cost_method: "Quantity" | "Value" | "Dimensions" | "Weight";
};

/** Body of create and update (UNVERIFIED shape: inferred from the detail keys; confirm before wiring a real backend). */
export type ItemInputDto = Pick<ItemDto, "name" | "sku" | "product_type" | "unit" | "rate" | "purchase_rate" | "description" | "purchase_description" | "category_name" | "brand" | "manufacturer" | "account_name" | "purchase_account_name" | "track_inventory" | "inventory_valuation_method" | "is_returnable"> & {
  reorder_level: number | null;
  alias_name?: string; upc?: string; ean?: string; mpn?: string; isbn?: string; weight?: string; dimensions?: string;
  mrp?: number | null; min_profit_percent?: number | null; vendor?: string; inventory_account?: string; bin_tracking?: boolean; tracking_type?: "none" | "serial" | "batch"; custom_fields?: Record<string, string>;
};

/** Lookup lists the New/Edit form needs (`/product/editpage`, observed live; reduced to what the form uses). */
export type EditPageDto = { units: string[]; categories: string[]; brands: string[]; manufacturers: string[]; vendors: string[]; income_accounts: string[]; purchase_accounts: string[]; inventory_accounts: string[]; valuation_methods: { id: "FIFO" | "WAC"; label: string }[] };

/** One stock location of an item (`/items/{id}/locationdetails`). */
export type ItemLocationDto = { location_id: string; location_name: string; is_primary: boolean; stock_on_hand: number; committed_stock: number; available_for_sale: number };

/** One quote line shown in the Transactions tab (`/items/transactions/estimates?item_id=`). Only quotes were seen live. */
export type ItemTransactionDto = { transaction_id: string; date: string; number: string; customer_name: string; quantity: number; rate: number; total: number; status: string };

/** One history entry. UNVERIFIED path: the ERP reads `/v4/tasks?entity_type=item&entity_id=`; the mock uses `/items/{id}/history`. */
export type ItemHistoryDto = { history_id: string; date: string; details: string; by: string };

export type ItemListQuery = {
  page: number;
  per_page: number;
  filter_by: string;
  sort_column: string;
  sort_order: "A" | "D";
  search_text?: string;
};

/** Endpoint table: method, path under `/api/v3`, request and response shapes. */
export type ItemsEndpoints = {
  "GET /items": { query: ItemListQuery; response: ApiOk<{ items: ItemDto[]; page_context: PageContext }> };
  "GET /items/{id}": { response: ApiOk<{ item: ItemDto }> };
  "GET /items/{id}/locationdetails": { response: ApiOk<{ locations: ItemLocationDto[] }> };
  "GET /items/transactions/estimates": { query: { item_id: string; page: number }; response: ApiOk<{ transactions: ItemTransactionDto[] }> };
  "GET /items/{id}/history": { response: ApiOk<{ history: ItemHistoryDto[] }> };
  "GET /product/editpage": { response: ApiOk<EditPageDto> };
  "POST /items": { body: ItemInputDto; response: ApiOk<{ item: ItemDto }> };
  "PUT /items/{id}": { body: ItemInputDto; response: ApiOk<{ item: ItemDto }> };
  "DELETE /items/{id}": { response: ApiOk<Record<string, never>> };
  /** `action` is active, inactive, lock, unlock or clone. All inferred (unverified). */
  "POST /items/{id}/{action}": { response: ApiOk<{ item?: ItemDto }> };
  "GET /settings/preferences/items": { response: ApiOk<{ preferences_items: PreferencesDto }> };
  /** Body: form field `JSONString` holding the full PreferencesDto. */
  "PUT /settings/preferences/items": { body: PreferencesDto; response: ApiOk<{ preferences_items: PreferencesDto }> };
};
