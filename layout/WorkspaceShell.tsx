import type { ReactNode } from "react";
import type { WorkspaceContext } from "@boss/sdk";
import { WorkspaceBody } from "./WorkspaceBody";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { ThemeProvider } from "./ThemeProvider";
import { visibleNavItems } from "./navConfig";
import { filterNavGroups } from "../utils/filter-nav";
import { buildSearchDestinations } from "../utils/search-destinations";
import { visiblePosDestinations } from "../constants/pos-retail-billing-destinations";
import { effectiveModuleKeys } from "../utils/workspace-access";
import { friendlyName } from "../utils/friendly-name";
// Direct leaf import, not the "@/modules/self-service-portal" barrel — that
// barrel also re-exports server-only page components; a leaf import here
// keeps this module-content data cleanly separate from them.
import { SELF_SERVICE_EMPLOYEE_NAV_GROUPS, SELF_SERVICE_ADMIN_NAV_GROUPS } from "@/modules/self-service-portal/nav";
// Same for the route constants: the routes leaf, not the barrel (CLAUDE.md
// §3.1's documented deep-import exception). Only the resulting string crosses
// into the "use client" header, as its profileHref.
import { SELF_SERVICE_ROUTES } from "@/modules/self-service-portal/routes";
// Same documented routes-leaf deep import (CLAUDE.md §3.1) for the Setup Centre Branches tab link.
import { TENANT_ORGANIZATION_ROUTES } from "@/modules/administration/routes";

/**
 * The tenant-workspace frame, on Setu's shell structure: icon rail (a bottom
 * tab bar on phones) beside a header over the page area, with Boss's header
 * items (org · search · quick-create/notifications/setup/profile) and Boss's
 * rail+drawer body. Wraps everything in the theme provider (light / dark /
 * system, persisted per browser). Quick-create and notifications are honest
 * placeholders (CLAUDE.md §1.1 no-time-pass) — no business module exists yet
 * to back them; search is real but indexes only the pages this user can
 * navigate to; Setup Centre is a real link since it needs no business data.
 * The rail+drawer body (WorkspaceBody) owns its own click/collapse state — a
 * Server Component can't hold that, hence the split. Nav is filtered to what
 * the tenant's enabled modules actually allow — UX only, each page still
 * guards itself.
 */
export function WorkspaceShell({
  context,
  hasLinkedEmployee,
  pendingCashHandovers = null,
  children,
}: {
  context: WorkspaceContext;
  /** Does the caller themselves have a linked, login-enabled Employee
   *  record in the active organization — computed once in
   *  app/(workspace)/layout.tsx. Gates the "My Profile/Attendance/
   *  Documents" self-service drawer section independently of raw
   *  permission keys, since owner/admin roles grant "*" (which would
   *  otherwise satisfy those permission checks for someone who isn't an
   *  employee at all, leading them into a page that just 403s). */
  hasLinkedEmployee: boolean;
  /** The caller's waiting cash handovers (POS drawer badge, owner decision D7), read once in
   *  app/(workspace)/layout.tsx; null when not applicable or unreadable — no badge, never a made-up 0. */
  pendingCashHandovers?: number | null;
  children: ReactNode;
}) {
  const permissionKeys = new Set(context.permissions.map((p) => p.key));
  // visibleNavItems: orgModuleKeys (tenant ceiling ∩ org-level narrowing —
  // self-service-portal-plan.md §D6/§H.3), further narrowed to modules THIS
  // user actually holds a permission in: orgModuleKeys alone only says the org
  // enabled the module for someone, so without it every logged-in user would
  // see every org-enabled module regardless of their own grants. Shared with
  // the landing decision (`hasWorkspaceAccess`) and the dashboard's "Modules
  // at a Glance", so none of them can disagree.
  const items = visibleNavItems(context);
  const moduleKeys = effectiveModuleKeys(context);
  const employeeGroups = hasLinkedEmployee
    ? filterNavGroups(SELF_SERVICE_EMPLOYEE_NAV_GROUPS, permissionKeys, moduleKeys)
    : [];
  const selfServiceGroups = [...employeeGroups, ...filterNavGroups(SELF_SERVICE_ADMIN_NAV_GROUPS, permissionKeys, moduleKeys)];
  // The profile menu's "Profile" uses exactly the drawer's "My Profile" gate
  // (linked employee + SelfServiceProfile.Read) — anyone else would land on a
  // self-service page that just 403s, so they get no Profile item at all.
  const profileHref = employeeGroups.some((group) => group.items.some((item) => item.href === SELF_SERVICE_ROUTES.profile))
    ? SELF_SERVICE_ROUTES.profile
    : undefined;
  // The Branches tab of the organization window needs Organization.Read (to open the window) and Branch.Read; the link is
  // offered only to a member holding both, so "No branches yet" never points at a page that would refuse them.
  const branchesSetupHref =
    context.activeOrganization && permissionKeys.has("Organization.Read") && permissionKeys.has("Branch.Read")
      ? TENANT_ORGANIZATION_ROUTES.tab(context.activeOrganization.id, "branches")
      : undefined;
  const posDestinations = visiblePosDestinations(permissionKeys);
  const posNav = { destinations: posDestinations, pendingHandovers: pendingCashHandovers };
  const searchDestinations = buildSearchDestinations({ items, selfServiceGroups, posDestinations });

  // Keyed because it crosses the server→client boundary as a prop and
  // WorkspaceBody renders it beside sibling elements: an element arriving over
  // RSC can't be marked as a static child on the client, so without a key React
  // logs "Each child in a list should have a unique key" for it in dev.
  const header = (
    <WorkspaceHeader
      key="workspace-header"
      workspaceName={context.workspace?.displayName}
      financialYears={context.financialYears}
      activeFinancialYearStart={context.activeFinancialYear?.startYear}
      branches={context.branches}
      canViewBranches={context.canViewBranches}
      branchesSetupHref={branchesSetupHref}
      activeBranchId={context.activeBranch?.id ?? null}
      organizations={context.organizations}
      activeOrganizationId={context.activeOrganization?.id ?? null}
      user={{
        // Same name the dashboard greets them by: an owner whose display name
        // is still their email (provisioning's default) shows "asha", with the
        // full address on the line below, not the address twice.
        name: friendlyName(context.user),
        email: context.user.email,
        roleLabel: context.user.tenantRole,
      }}
      profileHref={profileHref}
      searchDestinations={searchDestinations}
    />
  );

  return (
    <ThemeProvider>
      <div className="workspace-root flex h-dvh w-full flex-col overflow-hidden bg-[var(--shell-bg)] text-foreground">
        <WorkspaceBody items={items} selfServiceGroups={selfServiceGroups} posNav={posNav} header={header}>
          {children}
        </WorkspaceBody>
      </div>
    </ThemeProvider>
  );
}
