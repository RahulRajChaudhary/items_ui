# BOSS Items module: frontend build prompt

Paste this whole file into a new Claude session opened on a new, empty project folder.
Always answer me in English only (I may write Hindi or Hinglish).
Do not write any code until I say "go" for a phase. First read, then give me the plan (section 13), then wait.

---

## 1. Who I am, what we are building

I am building **BOSS**, my own ERP product. This session builds the **Items module** of BOSS: the module screens (Items, Composite Items, Bill of Materials, Plans and Addons, Price Lists, Pricing Widgets, Coupons) and the **Settings > Items** screens (Preferences, Fields, Validation Rules, Record Locking, Buttons, Related Lists), and the live connection between them (a saved setting changes the Items screens).

It is built as a **standalone Next.js app now**, and must later be **dropped into the main BOSS application** with no rewrite. That integration requirement drives every decision below.

I studied a reference ERP (a Zoho ERP trial) with browser DevTools to learn the screens and the API shapes. The reference is only a source of ideas and real examples. BOSS has its own name, own colors and own backend. Never copy reference branding, never write "Zoho" in the product UI.

## 2. Source material (read these first, in this order)

| What | Where | How to use it |
|---|---|---|
| Interactive wireframe (the visual guide) | https://claude.ai/artifact/N8NwYx4KaLYzuTBAJNFtQm (local file: `boss-items-wireframe.html` in this folder) | Open it, click through every screen. It is a **guide, not a spec**. It will change. Its code is throwaway prototype code: do not port it. Read its top comment ("CODING MAP") first. |
| Connectivity map (setting to Items effect, with evidence) | https://claude.ai/artifact/JJe6wEzWpvHBpzTimsUEVm (local: `boss-items-connectivity.html`) | Source of truth for "which setting changes which Items screen". Status Measured / Seen / Blocked tells you how sure each row is. |
| API pattern reference (how the backend talks) | https://claude.ai/artifact/UHYTiB4xEXhGeHWjUqUnE7 | Read the "How a click reaches the backend", "API catalogue" and "Error catalogue" tabs. It documents the request shape, headers, body format, error codes. |
| Capture notes of every live screen | `items_capture_notes.md` in this folder | Columns, dropdown entries, tabs, empty-state texts, form fields. |
| Wireframe design canvas (older, static boards) | https://claude.ai/artifact/RS2grdVJsWNwFTnNBHFhTM | Only for the other modules' look (shell, nav). Optional. |
| Older settings guide | https://claude.ai/artifact/6XGEke47wBLesgFbqudNZH | One card says decimal places does not change Items. That is wrong. The connectivity map is correct. |

If any link cannot be opened, tell me and use the local files.

**Security rule:** never copy cookies, CSRF tokens or session values from DevTools into code, files or chat. Names of headers are fine. Values are not.

## 3. Stack and hard rules

- **Next.js (App Router) + TypeScript with `strict: true`** (also `noUncheckedIndexedAccess`). No `any`. No `// @ts-ignore`.
- **Tailwind CSS** for styling, **lucide-react** for icons. No other UI kit.
- Data: **TanStack Query** for server state. Forms: **react-hook-form + zod**. Add nothing else without asking me first. Fewer dependencies is a goal.
- Colors, spacing, radius, font sizes come from **design tokens** (CSS variables mapped in the Tailwind config). No hard-coded hex values in components. Light and dark both defined, with an explicit background on the page.
- **No global CSS** except the token file. No global state outside the module. No `window` globals.
- Comments: every component, hook and API function gets a short comment saying **what it is for, what its props or arguments mean, and what it must not do**. Do not comment what a line does. Names use the product's words (Item, Coupon, BillOfMaterials), not UI words.
- **Reuse before writing.** Before adding a component, state in one line which existing component could not do the job and why. Target: the smallest possible set of components (section 6).
- Nothing in a component file may call `fetch` directly.
- No dead code, no commented-out code, no TODO without an owner and a reason.
- Ask before any `git commit`. Never add AI or tool attribution to code, comments or commits.

## 4. Frontend first principles (apply to every file)

1. **Boundaries first.** Three layers, one direction of dependency: `UI components` (draw only) -> `feature hooks and pure functions` (logic) -> `API client` (the only code that knows URLs). A component never knows a URL. The API layer never imports React.
2. **Types before screens.** Write the domain types and the API DTO types first. A mapper turns DTO into domain object, so a backend change touches one file.
3. **Config over copies.** Columns, filters, tabs, form fields and menu items are data. One renderer draws them. Adding a field means adding a line of data, not a component.
4. **One source of truth.** Server data lives in the query cache only. Form state lives in the form. UI state (open menu, selected row) lives in the component that owns it. Filters, sort, page, selected record and tab live in the **URL** (search params and route), so refresh, back and share links work.
5. **Make illegal states impossible.** Use discriminated unions for screen state (`loading | error | empty | ready`) instead of several booleans.
6. **Every async screen has four states:** loading skeleton, error with retry, empty state, data. A wireframe that only shows data is incomplete: build all four.
7. **Accessibility is default:** real `button`, `a`, `label`, `table` elements, visible focus, menus and dialogs that work with the keyboard (Escape closes, focus returns), `aria-label` on icon-only buttons.
8. **Integration safety:** the module takes everything environmental as **inputs, not imports**: API base URL, organization id, current user and role, permissions, locale, routing base path, theme tokens. See section 11.
9. **Performance by design:** server data paginated, long tables not rendered in full when large, no work in render that can be memoized once, in-flight requests cancelled when filters change.
10. **Small steps, verified.** Each phase ends with type check, lint, tests and a manual walk-through against the wireframe. State what you did not verify.

## 5. Project structure (module-first, so it moves into BOSS)

```
src/
  app/                      # thin Next.js routes only; they import from modules/items
  modules/items/            # EVERYTHING for this module lives here
    index.ts                # the only public entry (routes config, providers, nav entry)
    api/                    # client + endpoint functions + DTO types + mappers + error mapping
    domain/                 # domain types, zod schemas, pure helpers (format quantity, valuation labels)
    settings/               # settings registry, preference definitions, "effects" registry
    features/               # one folder per feature: items, composite, bom, plans, addons, products,
                            #   pricelists, widgets, coupons, settings-preferences, settings-fields, ...
    components/             # module-level compositions built from shared/ui
  shared/
    ui/                     # the small reusable kit (section 6). No business words in here.
    hooks/                  # useUrlState, useDisclosure, useDebounced, ...
    lib/                    # cn(), formatters (money, date, quantity), id helpers
    mocks/                  # mock server that implements the same API contract (section 8)
tokens.css                  # design tokens only
```
Rule: `shared/ui` knows nothing about Items. `modules/items` may import `shared`, never the other way. When BOSS integrates, `shared/ui` is replaced by BOSS's own kit by keeping the same props.

## 6. The reusable kit (keep it this small)

Build only these, in `shared/ui`, each with a props comment and a story or example page:

| Component | One job | Used by |
|---|---|---|
| `AppShell` slots: `TopBar`, `SideRail`, `RightRail` | Page frame, three slots; BOSS can pass its own | every screen |
| `SubNav` | Tab strip with optional dropdown tabs (Items menu, Plans and Addons menu) | module header |
| `MasterDetail` | Left list pane (title dropdown, plus button, more menu, rows) + right detail pane. Also supports "list only" mode | Items detail, BOM, Coupons, Plans, Addons, Products |
| `DataTable` | Config-driven table: columns (key, label, align, render), selection, sorting, loading/empty/error, **column customization**, **clip/wrap text**, sticky header, pagination footer | every list |
| `ColumnCustomizer` | Modal: search, checkbox per column, drag to reorder, locked first column, "N of M selected" | list screens |
| `DropdownMenu` | Menu and filter list (groups, search, checked state, footer link) | title dropdowns, row menus, More menus |
| `Tabs` | Tab bar with count badges | detail pages, forms |
| `DetailCard` + `KeyValueGrid` | Ribbon/status header card and label-value grid | all details |
| `FormShell` | Page or modal form frame: title, close, body, **sticky footer** (Save, Cancel), unsaved-changes guard | every create/edit form |
| `Field` | Label-left row: label (required marker), control, hint, error. Wraps input, select, textarea, checkbox, radio, switch, number, money, date | every form |
| `Modal` | Dialog with focus trap | confirms, small forms, customizer |
| `EmptyState` | Title, text, action buttons, optional illustration slot | every list |
| `Banner` | Info, warning, error, success messages | settings callouts, refusal messages |
| `Badge` / `StatusPill` | Active, Inactive, counts | lists, details |

Everything else is a **composition** of these in `modules/items/components`. If you think you need a 15th shared component, stop and ask me.

## 7. Screens to build (what the wireframe shows)

For every screen: loading, error, empty and data states; keyboard use; responsive (the module must work from tablet width; phone is not required in phase 1).

### 7.1 Module shell and navigation
- Left rail (Home, Dashboard, People, Items, Inventory, Purchases, Manufacturing, Sales, Contributions, Sales Channels, Beat Management, More) with Items active. Top bar: product name BOSS, search, trial notice, organization name, quick-create, notifications, settings gear, profile. Right rail with icon strip and a collapse toggle. These are **slots that BOSS will fill**. Build simple defaults.
- Module sub-nav: `Items ▾` (dropdown: Items, Composite Items), `Bill of Materials`, `Plans and Addons ▾` (dropdown: Plans, Addons), `Price Lists`, `Pricing Widgets`, `Coupons`. Products is reached from the Plans screen.

### 7.2 Items list
- Title is a dropdown: search box, **Default filters (19)**: All, Active, Inactive, Sales, Purchases, Services, Zoho CRM*, Inventory Items, Non-inventory Items, Bin Tracked Items, Returnable Items, Non Returnable Items, Replenishment Configured, Replenishment Not Configured, Replenishment Paused, Ungrouped Items, Marketplace Items, Unconfirmed Items, Funds; then **Created By Me (5)**: Revenue Funds, Corpus Funds, In Kind Funds, Government Grant Funds, Private Grant Funds; then "New View". (*Rename or drop integration-specific entries for BOSS; ask me.)
- Header controls: view dropdown (Expanded View, Collapsed View), List and Grid toggle, New (plus) button, More menu (Sort by, Import, Export, Preferences, Refresh List, Reset Column Width).
- Table: select-all checkbox; a sliders icon menu with **Customize Columns** and **Clip Text / Wrap Text**; name cell has an image thumbnail placeholder; numbers right-aligned; Total Count, per-page selector, previous/next.
- Customize Columns: 25 available columns (Name locked and first; default selected: SKU, Purchase Description, Purchase Rate, Description, Rate, Stock On Hand, Usage Unit; others: Account Name, Alias Name, Available for Sale, Brand, Category, Dimensions, EAN, Fund Type, ISBN, MPN, Manufacturer, Purchase Account Name, Reorder Level, Type, UPC, Vendor Name, Weight). Drag to reorder. Saved per user (the reference stores this per custom view; ask me where BOSS should store it).
- Grid view: card per item (name, SKU, stock in hand, selling price, cost price).
- Collapsed view: grouped list titled "Multi Variant Items" with columns Name, SKU, Stock On Hand, Reorder Point; empty text "No Records Found".
- Empty filter text pattern seen: "There are no inactive items." The true no-data empty state of the whole list was **not captured**: ask me for the BOSS copy.
- Real-world note: the reference account has about 2,000 test items. The list must stay fast with large pages.

### 7.3 Item detail (split view)
- Left: compact list with checkbox, name, price, SKU; title dropdown; plus and more buttons.
- Right header: title, edit (pencil), Adjust Stock (primary), More menu (Clone Item, Mark as Inactive, Delete, Move to another item, Lock item / Unlock item), close. Under the title: Returnable Item badge. Custom buttons from Settings appear beside Adjust Stock. A locked item shows a locked tag and edit is refused with the message "You are restricted to perform this action Edit as the record is locked."
- Tabs: Overview, Locations, Transactions, History; plus Related Lists tab when a related list exists; plus Batches tab for batch-tracked items (gear menu: Configure Batch Numbers).
- Overview: two columns. Left: Primary Details, Purchase Information, Sales Information, Retail Preference (Configure), Reporting Tags, Associated Price Lists (collapsible), Sales Order Summary chart (period dropdown, total sales legend). Right: image upload card (front, rear, other images up to 15, 5 MB each), stock panel (Opening Stock, Stock on Hand, Committed, Available for Sale, four quantity tiles, Reorder Point). **All quantities use the decimal places setting.**
- Locations tab: Stock Locations table, location permission, all-locations dropdown; columns Location Name, Stock On Hand, Committed, Available for Sale.
- Transactions tab: filter by transaction type and status; columns Date, Quote Number, Customer Name, Quantity Sold, Price, Total, Status.
- History tab: Date, Details.

### 7.4 New / Edit Item form
Sections: Basic (name, type goods/service, category, brand, manufacturer, images), Item details (single/variants, unit, SKU, identifiers UPC MPN EAN ISBN), Sales and purchase (selling price, sales account, cost price, purchase account, descriptions, preferred vendor, MRP and Minimum Profit when active), Inventory (track inventory, bin tracking, **Inventory Tracking None/Serial/Batch only when enabled in settings**, inventory account, valuation method default from settings, GRNI account, purchase variance account, reorder point), Returns and fulfilment (returnable, dimensions with unit from settings, weight with unit from settings), Additional information (Fund Type and active custom fields). The form is **generated from data**: the New Item prerequisites call returns dropdown lists, custom fields and field definitions (section 9). Fields marked inactive are hidden; mandatory ones show the required marker and are validated; fields set to read-only or hidden for the current role must obey that.

### 7.5 Other module screens
- **Composite Items:** filter dropdown (All Composite Items, Ungrouped Items, Active Items, Low Stock Items, Inactive Items, Assembly, Kit); empty state with New and Import buttons; full New Composite Item form (assembly or kit, associated items table with add row and add services, sellable and purchasable blocks with "copy from total", dimensions, identifiers, fund type, bin tracking, accounts, valuation, reorder point). The list columns are **not captured**: ask me.
- **Bill of Materials:** list (BOM#, name, status, description, item to produce, quantity, unit); master-detail with status ribbon, summary (item to produce, quantity, totals), toolbar (Edit, Create Manufacturing Order, PDF/Print, Cost Overview, more), tabs with count badges (Details, Components, Operations, Manufacturing Orders). **New BOM form:** grey Name strip, BOM# (auto, settings gear), Item to Produce, Quantity, Description, tabs Components (table: #, name, quantity, scrap %, unit, delete; Add Component) and Operations (name, instructions, work center type, duration mm:ss, blocked by operations, attachment; Add Operation); sticky Save and Cancel.
- **Plans, Addons, Products:** three lists with different title dropdowns (Plans: All, Active, Inactive. Addons: All, Active, Inactive, Recurring, One Time. Products: All, Active, Inactive) and different columns (see section 9). Product detail has Add Plan and Add Addon, an "Almost there" empty state, and Plans/Addons tabs. New Plan, New Addon (tabs: Pricing, Plans for addon, Hosted Payment Pages and Portal, Other Details) and New Product (modal). Plan detail: price header, hosted payment page URL, MRR and ARR, tabs Plan Details, Addons, Price Lists, Activity Logs.
- **Price Lists:** empty state with the lifecycle diagram (Create Price List, then Sales or Purchase price list, then All Items or Individual Items, then Invoice or Bill); list columns Name and Description, Currency, Details, Pricing Scheme, Round Off Preference, Actions (Edit, Mark as Inactive, Delete with confirm); New Price List page.
- **Pricing Widgets:** empty state; New opens a modal (Name, Product, Proceed). The builder after Proceed is **not captured**.
- **Coupons:** list; master-detail with Active ribbon, discount box, activation date, copyable code box, tabs Coupon Details (with Applicable Products / Eligible Customers switch), Coupon Code, Transactions, Activity Logs; Mark as Inactive; New Coupon form.

### 7.6 Settings > Items
- **Frame:** settings header (back/collapse arrow, "All Settings", organization, search settings, Close Settings), collapsible left menu with grouped accordions, a Settings home page of cards, the Items settings page with six tabs. Preferences has a **sticky footer** with Save and Cancel.
- **Preferences:** units and defaults (decimal places 0-6, dimensions unit, weight unit, barcode scan field SKU/ISBN/UPC/EAN), default valuation method (FIFO or Weighted Average Cost), duplicate item names (requires SKU active and mandatory), enhanced search, price list at line level, pricing rule, redirection URL, quantity limit (restrict or warn), inventory tracking and start date, serial tracking (+ options + Tracked in + Mandatory Configure dialog), batch tracking (+ allow duplicate batches, returns only to sold batch, different MRP/Selling price per batch with Sales Margin % and Price Selection, auto-generate batch numbers with configure dialog, auto batch assignment with FIFO/FEFO/LIFO method, Tracked in, Mandatory Configure), prevent stock below zero (organization or location level), out-of-stock warning, reorder notification (notify-to email), landed cost (allocation method Quantity, Value, Dimensions, Weight), replenishment (frequency, schedule time, include inbound stock).
- **Fields:** usage counter (N/135), table (name, data type, mandatory, show in PDFs, status, row menu). **Row menus differ per field**: SKU: Inactive, Show in PDFs, Mandatory, Configure Access. Brand, Manufacturer, Preferred Vendor: Inactive, Mandatory, Configure Access. Selling and Purchase Price: Configure Access only. Minimum Profit, Category, Alias Name: Inactive only. Image: Inactive, Show in PDFs. MRP: Inactive, Mandatory. UPC MPN EAN ISBN: Edit, Inactive, Mandatory, Configure Access. Fund Type: no menu. **New Field page** with 24 data types; the form changes by type (remaining-fields counter, help text, data privacy, duplicate prevention, input format, default value, dropdown options, file type, mandatory, show in transactions). **Configure Access** modal: 23 roles x Read and Write / Read Only / Hide Field.
- **Validation Rules, Record Locking, Buttons, Related Lists:** empty state, New form, saved list. Details in the capture notes.

### 7.7 Settings to Items connection (core feature)
Every saved preference must visibly change the Items screens as listed in the connectivity map. Build this as **data, not special cases**: one `settings` object from the API, read through `useItemSettings()`. Components ask the hook (`formatQuantity(n)`, `isSerialEnabled`, `dimensionUnit`) and never read raw JSON. When a setting is not Measured in the connectivity map, say so in a comment and do not invent behavior.
The wireframe also **jumps to and highlights the changed field after Save**. That is a prototype aid, not a BOSS feature. Keep it out of production code unless I ask (a dev-only "show what changed" toggle is acceptable).

## 8. API-first rule (the backend is not ready; the frontend must not care)

1. Treat the API contract in section 9 as the truth. Write **`api/contract.ts`** (types) first.
2. Build `shared/mocks`: a mock server (MSW in the browser/tests, or Next route handlers in dev) that implements **the same endpoints, same envelopes, same error codes**. Seed it with the sample data from the wireframe.
3. Switching mock to real backend is **one environment variable** (`NEXT_PUBLIC_BOSS_API_BASE`) and nothing else.
4. A UI feature is not done until it works against the mock **and** its request/response shapes are written in the contract file.
5. If the backend later differs, only `api/` (client, DTOs, mappers) changes. Components must not change.
6. Before building any **write** call that section 9 marks "inferred", open the reference ERP in DevTools, perform the action on a ZZ-prefixed test record, copy the method, path, field names and error cases (never tokens), then delete the record. Update section 9 in the repo docs.

## 9. API contract (observed on 19 Nov 2026)

### 9.1 Conventions (from the API reference artifact and live traffic)
- Base: `/api/v3/<resource>`. Every request carries `organization_id=<id>` as a query parameter. Some embedded services use `/api/v1/...&request_service=<name>` (payroll, expense). Items use v3.
- Same-origin cookies authenticate. Writes carry header **`x-zcsrf-token`** (value comes from the CSRF cookie; never log it), plus `x-zoho-include-formatted: true`, `x-zb-source: zbclient`, `x-zb-asset-version`, `x-role-id`.
- Write bodies are `application/x-www-form-urlencoded` with two fields: `JSONString` (a JSON object as text) and `organization_id`. (Embedded payroll uses plain JSON; not relevant here.)
- With `x-zoho-include-formatted: true` responses carry extra `*_formatted` fields (display strings). BOSS should format on the client from raw values and decimal settings, and **not depend on `_formatted` strings** (ask me if the BOSS backend will provide them).
- Envelope: `{ "code": 0, "message": "...", "<entity or list>": ... }`. `code 0` is success. Lists add `page_context: { page, per_page, has_more_page, report_name, applied_filter, custom_fields, sort_column, sort_order }`.
- Errors (HTTP 400/404 with code and message): code 2 "Invalid value passed for <field>"; code 5 not found / invalid URL; code 15 "Please ensure that the <field> has less than N characters"; code 8 "Invalid Element"; 2900 SKU must be mandatory for duplicate names; 9168 serial cannot be turned off while serialized items exist; 1070673 validation rule alert (custom message); inventory tracking cannot be disabled while inventory items exist (message only). One problem is reported per Save; the UI must show the server sentence in a banner and keep the user's input.
- Rate limit headers seen: `x-user-access-limit`, `x-user-access-remaining`. Session expiry shows as a redirect to the sign-in service; handle it in the client (one central place).
- **Never send a partial preferences update.** A partial PUT merges and can be rejected ("Invalid Element", code 8). The reference UI always sends the **full** preferences object. Do the same.

### 9.2 Reads observed (GET)
| Screen | Call |
|---|---|
| Items list | `/items?page=1&per_page=25&filter_by=Status.Active&sort_column=created_time&sort_order=A&usestate=true` and `/customviews?entity_type=item` (filters and saved column layout) and `/customfields?entity=item` |
| Items meta | `/meta?keys=items_meta`; after a preference save: `/meta?keys=pricebook_meta,items_meta,advanced_tracking_meta,replenishment_meta` |
| Item detail | `/items/{id}`, `/items/{id}/inventorysummary`, `/dashboard/salessummary?filter_by=SalesOrderDate.ThisMonth&item_id={id}`, `/chatlets/count?entity_type=item&entity_id={id}` (comment count) |
| Item tabs | Locations: `/items/{id}/locationdetails`. Transactions: `/items/transactions/estimates?page=1&item_id={id}` (the type dropdown picks the endpoint; only quotes seen). History: `/v4/tasks?entity_type=item&entity_id={id}` |
| New Item | `/product/editpage` returns: taxes, accounts lists (income, purchase, inventory, intermediate, purchase price variance, fixed asset), valuation methods, units, brands, manufacturers, categories, custom_fields, entity_fields, page_layout, weight and dimension units, default sales margin, product_settings |
| Composite | `/customviews?entity_type=compositeitem`, `/compositeitems?page=1&per_page=25&filter_by=Status.All&sort_column=name&sort_order=A&usestate=true`, `/compositeitems/editpage` |
| BOM | `/customviews?entity_type=bill_of_materials`, `/billofmaterials?page=1&per_page=200&filter_by=Status.All&sort_column=created_time&sort_order=D&usestate=false`, `/billofmaterials/{id}`, `/manufacturingorders?billofmaterials_id={id}&version_id={vid}`, `/billofmaterials/editpage`, `/customfields?entity=billofmaterial` |
| Plans / Addons / Products | `/plans?...filter_by=PlanStatus.All&sort_column=created_at&sort_order=A`, `/addons?...filter_by=AddonStatus.All`, `/products?page=1&usestate=true`, `/plans/editpage`, with `/customviews?entity_type=plan|addon|zsproduct` and `/customfields?entity=plan|addon|zsproduct` |
| Price lists | `/pricebooks?page=1&per_page=25&filter_by=SalesOrPurchaseType.All&usestate=true`, `/meta?keys=pricebook_meta`, `/pricebooks/editpage`, `/meta?keys=is_pricebook_overwrite_enabled` |
| Coupons | `/coupons?page=1&per_page=25&filter_by=CouponStatus.All&sort_column=created_at&sort_order=A&usestate=true`, `/coupons/{id}`, `/coupons/editpage`, `/meta/todaydate`, `/customfields?entity=coupon` |
| Pricing widgets | no data call seen (empty list) |
| Settings | `/settings/preferences/items`, `/settings/fields?entity=item`, `/settings/fieldvalidations?entity_type=item&rule_type=validation`, `/settings/recordlockingconfigurations?entity=item`, `/settings/custombuttons?entity_type=item`, `/settings/relatedlists?entity=item`, `/settings/preferences/general`, `/organizations/emails` |

### 9.3 Writes
- **Observed:** `PUT /settings/preferences/items` (form body: `JSONString` + `organization_id`; reply `{code:0, message:"Your item preferences have been saved.", preferences_items:{...}}`; then the client re-reads `customviews?entity_type=item` and the meta keys above).
- **Inferred, verify before building (section 8.6):** create/update/delete for items (`POST /items`, `PUT /items/{id}`, `DELETE /items/{id}`), mark active/inactive (the reference uses `POST <resource>/{id}/inactive` and `/active` for locations), clone, lock/unlock, adjust stock, composite items, BOM, plans, addons, products, price lists, coupons, custom fields, validation rules, record locking, buttons, related lists, per-field "mandatory", "inactive", "show in PDFs", "configure access".

### 9.4 Preferences object (keys of the PUT body)
`quantity_precision, is_composite_item_enabled, is_pricebooks_enabled, is_inventory_enabled, is_serial_number_enabled, is_batch_tracking_enabled, advanced_inventory_tracking_optional, is_reorder_notification_enabled, books_start_date, custom_fields, warning_out_of_stock, is_landed_cost_enabled, restrict_negative_available_stock, dimension_unit, weight_unit, can_show_lineitem_pricebook, is_item_name_duplication_enabled, is_box_business, is_item_image_enabled, is_item_image_in_pdf_enabled, barcode_scanner_field, is_pricing_rule_enabled, is_item_autocomplete_new_search_enabled, is_customer_qty_control_enabled, is_sales_person_qty_control_enabled, is_customer_qty_control_show_error, is_sales_person_qty_control_show_error, is_batch_price_enabled, sales_margin_percentage, is_auto_batch_enabled, is_replenishment_enabled, default_replenishment_trigger, default_replenishment_trigger_frequency, default_replenishment_trigger_period, additional_preferences, consider_inbound_stock_for_task_generation, replenishment_trigger_time, is_auto_batch_assignment_enabled, default_inventory_valuation_method, redirect_url`.
UI-to-key pairing (inferred from names, **confirm each by toggling it in DevTools**): decimal places = `quantity_precision`; dimensions unit = `dimension_unit`; weight unit = `weight_unit`; barcode field = `barcode_scanner_field`; default valuation = `default_inventory_valuation_method`; duplicate names = `is_item_name_duplication_enabled`; enhanced search = `is_item_autocomplete_new_search_enabled`; price list at line = `can_show_lineitem_pricebook`; pricing rule = `is_pricing_rule_enabled`; redirect URL = `redirect_url`; quantity limit = the four `*_qty_control_*` keys; inventory tracking = `is_inventory_enabled`; start date = `books_start_date`; serial = `is_serial_number_enabled`; batch = `is_batch_tracking_enabled`; batch price per batch = `is_batch_price_enabled` + `sales_margin_percentage`; auto batch numbers = `is_auto_batch_enabled`; auto assignment = `is_auto_batch_assignment_enabled`; prevent negative = `restrict_negative_available_stock`; out-of-stock warning = `warning_out_of_stock`; reorder notify = `is_reorder_notification_enabled`; landed cost = `is_landed_cost_enabled`; replenishment = the `*replenishment*` keys and `consider_inbound_stock_for_task_generation`.
Also in `/meta` for settings: `is_sku_mandatory`, `is_mrp_mandatory`, item-name-duplication flags: use them for the duplicate-names rule and the field requirements.

### 9.5 Item list row keys (DTO subset)
`item_id, name, sku, status, unit, rate, purchase_rate, description, purchase_description, stock_on_hand, available_for_sale, available_stock, track_inventory, is_returnable, item_type, product_type, category_name, brand, manufacturer, account_name, purchase_account_name, is_combo_product, group_id, group_name, attribute_*, upc, source`.

### 9.6 Item detail keys (DTO subset)
`item_id, name, sku, alias_name, brand, manufacturer, category_id, unit, description, rate, purchase_rate, account_id, purchase_account_id, inventory_account_id, intermediate_account_id, purchase_price_variance_account_id, inventory_valuation_method, track_inventory, is_returnable, reorder_level, initial_stock, stock_on_hand, committed_stock, available_for_sale_stock, vendor_id, upc, ean, isbn, part_number, min_profit_percent, custom_fields, custom_field_hash, lock_details, locked_actions, locked_fields, locations, preferred_vendors, is_combo_product, combo_type, has_variant, created_time, last_modified_time`.

### 9.7 Other entity keys (DTO subset)
- Coupon: `coupon_id, coupon_name, coupon_code, status, discount_by, discount_value, minimum_order_value, max_redemption_count, max_redemption_count_per_user, expiry_at, activation_time, eligible_products, eligible_customers, apply_to_plans, apply_to_addons, redemption_count, custom_fields`.
- Bill of materials: `billofmaterials_id, billofmaterials_name, billofmaterials_number, version_id, status, finished_product_id, finished_product_name, finished_product_sku, finished_product_quantity, unit, description, components, operations, associated_mo_count, is_bom_editable, lock_details`.
- List columns for plans, addons, products, price lists, coupons: see the capture notes.

## 10. State, settings and permissions

- `useItemSettings()` is the only reader of preferences. Saving preferences invalidates: settings, items meta, items list, item detail, new-item prerequisites.
- Field definitions (active, mandatory, access per role) come from the fields API and drive form generation and table columns.
- Permissions: build a `can(action, resource)` function that receives permissions from the host. In standalone mode use a mock. Hide or disable actions; never rely on hiding alone for security.
- Locked records: `lock_details`, `locked_actions`, `locked_fields` from the item decide what is disabled.

## 11. Integration contract (so it plugs into BOSS later)

`modules/items/index.ts` exports exactly:
- `ItemsRoutes` (route table with relative paths) and `ItemsSettingsRoutes`
- `ItemsProvider` with props: `apiClient` (an object implementing the module's API interface), `session` (organization id, user, role, permissions), `locale` (language, currency, date format, number format), `basePath`, `renderShell` (optional slot overrides), `features` (flags)
- `itemsNavEntry` (label, icon name, path) for BOSS's menu
Nothing else is imported by the host. No module code reads `process.env` directly except in one `config.ts`. No hard-coded currency symbol or date format: use locale (the reference uses INR with Indian digit grouping and date `dd/MM/yyyy`).
Write a short `INTEGRATION.md` in the repo: how to mount, what to pass, what BOSS must provide.

## 12. Edge cases and quality checklist (use as acceptance criteria)

**Data and display**
- Quantities: decimals 0 to 6 from settings, everywhere (lists, grid, detail, tiles, locations, transactions, forms, placeholders). Money: locale grouping, negative values, zero.
- Long names (100+ characters), names without spaces, empty optional fields (show blank or "-" consistently), missing images, services (no stock fields), funds, inactive items, locked items.
- Very large lists (2,000+ rows, 25 to 200 per page), last page, page beyond range, `has_more_page` false.
- Sorting (server-side), filter change resets page to 1, filter + sort + page live in the URL.
- Column customization: locked Name, at least one more column required, saved layout, reset width; clip vs wrap; horizontal scroll with sticky first column.
- Empty states differ: no data at all vs no result for a filter vs no permission.
- Stale data: after create/update/delete the list and detail refresh; deleting the selected row selects the next or closes the detail.
- Concurrent edit: show server error, keep input, offer reload.

**Forms**
- Client validation mirrors server rules, but **the server message is always shown** when it differs. One server error at a time per Save.
- Required fields; numeric limits; text limits (100 for names, 255 for long text, 250 for descriptions; confirm in contract); duplicate name refusal (code 150003 style); SKU mandatory dependency; validation rules from settings (custom alert, record not saved); read-only and hidden fields per role.
- Double submit prevented (disable Save while pending). Cancel with unsaved changes asks to confirm (the reference shows "Leave this page?"). Sticky footer never scrolls away.
- Unit or tracking choice changes the form (serial/batch selector appears only if enabled). Inventory tracking cannot be toggled once transactions exist (show the helper text).
- Custom fields: all 24 types render correctly in the form and the detail; formula fields appear only on the detail page.

**Settings**
- Preferences saves the **full** object. Reverting a switch that the server refuses (inventory tracking off with stock; serial off with serialized items; duplicate names without mandatory SKU) must roll the control back and show the message.
- Sub-options appear and disappear with their parent; hidden sub-option values are still sent unchanged.
- The Mandatory "Configure" dialog is locked when auto batch numbers and auto assignment are both on.
- Fields: usage counter, remaining counter per data type, mark active/inactive, mandatory, PDFs, configure access (23 roles), delete only for created fields.
- Unsaved changes in a tab and tab switching: warn.

**Network and platform**
- Loading skeletons, retry, cancel in-flight requests on navigation, timeouts, offline message, session expiry handled centrally, rate-limit friendly retry (no retry on 4xx).
- Never log tokens or cookies. Strip them from error reports.
- Keyboard: tab order, Escape, Enter on rows, menu arrow keys. Screen-reader names for icon buttons and status badges.
- Light and dark theme from tokens. Responsive from tablet width; tables scroll inside their container, the page does not scroll sideways.
- Time zone and date formats from locale; no `new Date()` parsing of display strings.

## 13. How to work (phases, checkpoints)

First message to me: confirm you opened the sources (or say what you could not open), then give a **plan** only:
1. Folder structure and the exact list of shared components with their props (types only).
2. Domain types and the contract file outline.
3. The mock server design.
4. Phase list with a "done" definition for each, and the risks.
Then **wait for my "go"**.

Suggested phases (I may reorder; do not resequence without asking):
- **P0** Project setup: Next.js + TypeScript strict, Tailwind, tokens, lint, test runner, folder skeleton, `INTEGRATION.md` stub.
- **P1** Shared kit (section 6) with an examples page, a11y checked.
- **P2** API layer: contract types, client, error mapping, mock server, `useItemSettings`.
- **P3** Items list (list, grid, collapsed, filters, columns, clip/wrap) and Item detail with all tabs.
- **P4** New/Edit Item (generated form), Lock, Clone, Inactive, Delete.
- **P5** Settings shell + Preferences (sticky footer) and the connection to Items screens.
- **P6** Settings Fields (menus, New Field page, Configure Access), then Validation Rules, Record Locking, Buttons, Related Lists.
- **P7** Composite Items, BOM (list, detail, new), then Plans/Addons/Products, Price Lists, Pricing Widgets, Coupons.
- **P8** Hardening: edge cases in section 12, accessibility pass, performance pass, `INTEGRATION.md` complete.

For each phase: (a) say what you will build and which shared components it uses, (b) build it, (c) run type check, lint, tests, (d) walk the matching wireframe screens and list **differences you chose on purpose**, (e) list what you did not verify, (f) wait for my review. Do not start the next phase on your own.

## 14. The wireframe is a guide: how to handle changes

- If the wireframe and these instructions disagree, say so and ask me. Do not silently pick one.
- Things the wireframe does not settle (ask me, with a suggestion each): the true no-data empty state of the Items list, composite list columns, pricing widget builder and list columns, batch tab columns, where BOSS stores column layouts and saved views, which integration-specific filters (CRM, marketplace) BOSS keeps, copy and naming for BOSS, role and permission model, pin or reorder options beyond drag (the reference has none).
- Items marked "Seen" or "Blocked" in the connectivity map are not proven. Treat them as hypotheses and flag them in code comments.
- Known corrections found while studying: decimal places **does** change Items screens; two old settings guides disagree with the live behavior, trust the connectivity map; state of some fields (Alias Name, MRP, Minimum Profit) was seen both Active and Inactive, so do not hard-code their default state.

## 15. Definition of done for the whole module

- All screens in section 7 exist with loading, error, empty, data states.
- Every setting in the connectivity map that is "Measured" changes the matching Items screen through `useItemSettings()` and nothing else.
- Running against the mock server and against a server that implements section 9 requires only the base-URL variable.
- `INTEGRATION.md` lets another developer mount the module inside BOSS in under an hour.
- Type check, lint and tests pass. No unused exports. The shared kit has no business words.
