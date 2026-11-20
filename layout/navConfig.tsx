import type { WorkspaceContext } from "@boss/sdk";
import type { NavItem } from "../types/workspace-context";
import { WORKSPACE_ROUTES } from "../routes";
import { MODULE_LABELS, moduleIconSrc } from "../constants/module-labels";
import { filterNavItems } from "../utils/filter-nav";
import { effectiveModuleKeys } from "../utils/workspace-access";

// Real icon assets — copied from the reference implementation's own
// design-system files (48x48 tinted chip + stroke icon per module), not
// redrawn. See constants/module-labels.ts's MODULE_ICON_FILES for the
// filename mapping.
function moduleIcon(src: string, label: string) {
  // eslint-disable-next-line @next/next/no-img-element -- static design-system chip, not a Next-optimizable content image
  return <img key={src} src={src} alt="" width={32} height={32} aria-hidden title={label} />;
}

const DashboardIcon = moduleIcon("/icons/Dashboard.svg", "Dashboard");

/**
 * Sidebar nav config: Dashboard (always visible, no gating, navigates
 * directly) followed by every tenant-gateable business module. A module item
 * has no real page to navigate to yet, so `href` here is just a stable React
 * key (`#<moduleKey>`) — clicking it opens ModuleDrawer instead of
 * navigating (see Sidebar.tsx). Each item declares the moduleKey filter-nav.ts
 * checks against the tenant's granted modules — the only gating mechanism;
 * no registry, no plugin system. self-service-portal is treated exactly like
 * every other module here (drawer placeholder href) — its drawer content is
 * ModuleDrawer.tsx's own SelfServicePortalNav, the same pattern
 * people-payroll's drawer already uses.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: WORKSPACE_ROUTES.dashboard, label: "Dashboard", icon: DashboardIcon },
  // Roles & Permissions moved into Setup Centre (SetupCentrePage.tsx) — no
  // longer a top-level rail item.
  ...Object.entries(MODULE_LABELS).map(([key, label]): NavItem => {
    const src = moduleIconSrc(key);
    return {
      href: key === "items" ? "/items" : `#${key}`,
      label,
      icon: src ? moduleIcon(src, label) : null,
      moduleKey: key,
    };
  }),
];

/** The rail entries this user can see: Dashboard plus every module the tenant
 *  enabled AND this user holds a permission in (UX filtering only — each page
 *  still guards itself). Shared by the shell (rail) and the dashboard
 *  ("Modules at a Glance") so the two can never disagree. */
export function visibleNavItems(context: WorkspaceContext): NavItem[] {
  const permissionKeys = new Set(context.permissions.map((p) => p.key));
  return filterNavItems(NAV_ITEMS, permissionKeys, effectiveModuleKeys(context));
}
