/** Domain types of the Items module: what screens work with. Mappers turn API shapes into these, so a backend change touches one file. */

export type ItemType = "inventory" | "sales" | "purchases" | "service" | "fund";

export type Item = {
  id: string;
  name: string;
  sku: string;
  active: boolean;
  type: ItemType;
  isService: boolean;
  unit: string;
  sellingPrice: number;
  costPrice: number;
  description: string;
  purchaseDescription: string;
  stockOnHand: number | null;
  availableForSale: number | null;
  committed: number | null;
  reorderLevel: number | null;
  tracksInventory: boolean;
  returnable: boolean;
  category: string;
  brand: string;
  manufacturer: string;
  salesAccount: string;
  purchaseAccount: string;
  valuationMethod: "FIFO" | "WAC" | "";
  fundType: string;
  tracking: "none" | "serial" | "batch";
  locked: boolean;
  createdAt: string;
};

export type Page<T> = { rows: T[]; page: number; perPage: number; total: number; hasMore: boolean };

/** Item settings as screens read them (through useItemSettings only). */
export type ItemSettings = {
  quantityDecimals: number;
  dimensionUnit: "in" | "cm" | "mm";
  weightUnit: "lb" | "kg" | "g" | "oz";
  barcodeField: "SKU" | "ISBN" | "UPC" | "EAN";
  defaultValuation: "FIFO" | "WAC";
  allowDuplicateNames: boolean;
  inventoryEnabled: boolean;
  serialEnabled: boolean;
  batchEnabled: boolean;
  reorderNotification: boolean;
};

/** Screen state as one union, never several booleans. */
export type ScreenState<T> = { kind: "loading" } | { kind: "error"; message: string } | { kind: "empty" } | { kind: "ready"; data: T };
