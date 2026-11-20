# Mounting the Items module in BOSS

Everything lives in `src/modules/items`. The host imports only from `src/modules/items/index.ts`.

## What the host mounts
- **Routes** (`ItemsRoutes`, relative to your base path): items list, `new`, `edit/:id`, and one path per module tab
  (`composite`, `bom`, `plans`, `addons`, `products`, `pricelists`, `widgets`, `coupons`).
- **Settings** (`ItemsSettingsRoutes`): `items` (Preferences, Fields, Validation Rules, Record Locking, Buttons, Related Lists).
- **Navigation:** add `itemsNavEntry` to BOSS's menu.
- Wrap both in `ItemsProvider`.

## What the host passes (`ItemsProvider`)
| Prop | Meaning |
|---|---|
| `api` | An `ItemsApi` (use `createItemsApi(createApiClient({ baseUrl, organizationId }))` or your own with the same methods) |
| `organizationId` | Sent on every call as `organization_id` |
| `features.locationsEnabled` | Mirrors the organization's Locations setting; off hides every Locations tab |

## Backend switch
Standalone, the module talks to its built-in mock at `/api/mock`. To use a real backend set
`NEXT_PUBLIC_BOSS_API_BASE` (read only in `config.ts`). Nothing else changes.

## What BOSS must provide
- The endpoints in `api/contract.ts` and `api/resources.ts`. Entries marked UNVERIFIED were inferred and must be
  checked against the real backend before release.
- Writes use the `JSONString` + `organization_id` form body; a settings save always sends the full object.
- Session expiry: the client throws `SessionExpiredError`; the host decides where to send the user.
- The page frame (header, side rail) and design tokens. The module only uses token names (`bg-panel`, `text-mute`, `text-link`...)
  that `src/tokens.css` maps to the host's CSS variables, so light and dark follow the host.
- Locale: money and dates currently default to INR / en-IN in `shared/lib/format.ts`; pass the host's locale there.
- Permissions: the module hides actions it cannot do but does not enforce security; the backend must.

## Shared kit
`shared/ui` has no product words. If BOSS has its own kit, replace the files and keep the props.
The screens for Plans, Addons, Coupons and the others are data (`features/records/entities.tsx`), so changing a column or a field means
editing one line of config.

## Known open items
See `docs/settings-driven-ui.md` for which setting drives which screen, and the project notes for questions that need a BOSS decision
(filters tied to other products, column layout storage, the pricing widget builder).
