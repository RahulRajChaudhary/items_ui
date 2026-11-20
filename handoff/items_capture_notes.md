# Items module: live ERP capture (19 Nov 2026, read only)

## Top tabs
Items (dropdown: Items | Composite Items) | Bill of Materials | Plans and Addons (dropdown: Plans | Addons) | Price Lists | Pricing Widgets | Coupons

## Items list
- Title dropdown "Active Items": search box; DEFAULT FILTERS (19): All, Active, Inactive, Sales, Purchases, Services, Zoho CRM, Inventory Items, Non-inventory Items, Bin Tracked Items, Returnable Items, Non Returnable Items, Replenishment Configured / Not Configured / Paused, Ungrouped Items, Marketplace Items, Unconfirmed Items, Funds.
- CREATED BY ME (5): Revenue, Corpus, In Kind, Government Grant, Private Grant Funds. Each filter row has a small icon button. Footer link: New View.
- Toolbar: List View / Grid View toggle, New (+), More Actions (Sort by, Import, Export, Preferences, Refresh List, Reset Column Width), Advanced Search, Total Count: View, 25 per page, prev/next.
- Table: checkbox, NAME, SKU, PURCHASE DESCRIPTION, PURCHASE RATE, DESCRIPTION, RATE, STOCK ON HAND, USAGE UNIT.
- Grid View: cards with name, SKU, Stock in Hand (qty unit), Selling Price, Cost Price.
- Side rail icon buttons on the right.

## Item detail (split view)
- Left pane: title dropdown + New + More Actions, compact rows (name, price, SKU), paging footer.
- Right pane header: item name, [icon btn], Adjust Stock, More (Clone Item, Mark as Inactive, Delete, Move to another item, Lock item), Close (X, back to table). Badge: Returnable Item.
- Tabs: Overview | Locations | Transactions | History.
- Overview: Primary Details (Name, Type, SKU, Unit, Created Source, Inventory Account, Valuation, GRNI Account, Purchase Variance), Purchase Information, Sales Information, Retail Preference (Configure), stock, "This Month" chart.
- Locations: Stock Locations, Location Permission, All Locations dropdown; cols LOCATION NAME, STOCK ON HAND, COMMITTED, AVAILABLE FOR SALE.
- Transactions: Filter By (Quotes), Status (All); cols DATE, QUOTE NUMBER, CUSTOMER NAME, QUANTITY SOLD, PRICE, TOTAL, STATUS.
- History: DATE, DETAILS.

## Composite Items
Empty state: "Group different items together and sell them as a single item", NEW COMPOSITE ITEM, Import Composite Items. Title dropdown "All Composite Items".

## Bill of Materials
- List: title "All Bill Of Materials", New; cols BILL OF MATERIAL#, NAME, STATUS, DESCRIPTION, ITEM TO PRODUCE, QUANTITY TO PRODUCE, UNIT.
- Detail BOM-00001: Edit, Create Manufacturing Order, PDF/Print, Cost Overview, Comments, Close. Summary: Status, Item to Produce, Quantity, Total Components 1, Total Operations 1.
- Tabs: Bill of Materials Details | Components (1) | Operations (1) | Manufacturing Orders (2).
  Components cols NAME, QUANTITY, SCRAP PERCENTAGE, UNIT. Operations cols NAME, INSTRUCTIONS, WORK CENTER TYPE, DURATION (MM:SS), BLOCKED BY OPERATIONS, ATTACHMENT. MOs cols MANUFACTURING ORDER#, REFERENCE NUMBER, STATUS.

## Plans and Addons
- Plans list (empty): title dropdown All | Active | Inactive | New View; second tab link "Products"; New + More Actions; empty state "Create tailor-made plans for any pricing model" with New Plan button.
- Products list: title dropdown "All Products" (All | Active | Inactive | New View); cols NAME, DESCRIPTION, STATUS, PLANS, ADDONS; row "Rahul pvt ltd" Active 0/0; Advanced Search.
- Product detail: Edit, Add Plan, Add Addon, Close; empty state "Almost there! Finish creating your product" with Add Plan / Add Addon.
- Addons list: not captured live yet (guide has the form fields).

## Price Lists
Empty state: "Customize Your Item Pricing with Flexibility", CREATE PRICE LIST, "Life cycle of Price Lists". Title "All Price Lists", New.

## Pricing Widgets
Empty state: "Create Your First Pricing Widget" (embeddable widget text). New.

## Coupons
- List: title dropdown All | Active | Inactive | Expired | New View; cols NAME, COUPON CODE, STATUS, DISCOUNT VALUE, DISCOUNT BY, REDEMPTION TYPE, MAXIMUM REDEMPTION, VALID UPTO.
- Detail: header with % badge, name, code, One Time, ACTIVE; Edit, Mark as Inactive. Tabs: Coupon Details | Coupon Code (empty: "No Additional Coupon Codes Created Yet!", New, Import) | Transactions (cols AVAILED ON, INVOICE NUMBER, CUSTOMER NAME, DISCOUNT AMOUNT; "No Events found") | Activity Logs.

## Not yet captured
Expanded vs collapsed meaning confirmed only as: split view (compact list) vs full table; Add Plan / Add Addon form screens; New Price List and Pricing Widget dialogs; Items settings screens (live).

## Second pass (forms, dialogs, settings)
- Add Plan (#/plans/new): Product (select), Plan Name, Plan Code, Billing Frequency (Month(s)), Billing Cycles (auto-renews until canceled), Plan Description, image drop. Tabs: Pricing (Pricing Model Per Unit, Unit Name, Price INR /unit billed every month, Free Trial days, Setup Fee, Type Goods/Service) | Hosted Payment Pages & Portal (Widgets Preference, Plan Change toggles) | Other Details (Plan Account, Setup Fee Account, Fund Type). Save / Cancel.
- Addons list empty: "Pack extra value into subscriptions", New Addon.
- Add Addon (#/addons/new): Product, Addon Name, Addon Code, Description, Addon Type One-time/Recurring, Pricing Interval, images. Tabs: Pricing (model, unit, price /unit /month, Type) | Plans (Associated Plans: All Plans) | Hosted Payment Pages & Portal (Widgets Preference, Associate Addon) | Other Details (Account, Fund Type).
- New Price List (#/inventory/pricelists/new): Name, Transaction Type Sales/Purchase, Price List Type All Items / Individual Items (note: not for Subscription items), Description, Pricing Rule Markdown, Sales Rate by %, Round Off To (Never mind), View Examples, Save/Cancel.
- New Pricing Widget: modal with Name, Product (Select a product), Proceed / Cancel.
- Settings route #/settings/preferences/items; tabs Preferences, Fields, Validation Rules, Record Locking, Buttons, Related Lists. Fields header shows "Custom Fields Usage: 1/135" + New Field. Buttons has "View Logs", "Location: All" filter, INFO. Record Locking and Related Lists show empty states with New buttons. Preferences is one long page with a single Save at the bottom (sections: units, valuation, duplicate names, enhanced search, price lists, redirection URL, quantity limit, inventory, replenishments).
