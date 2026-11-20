"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, LogOut, Plus, Settings, UserRound } from "lucide-react";
import type { FinancialYearRecord, WorkspaceBranch, WorkspaceOrganization } from "@boss/sdk";
import { initialsOf, readableRole } from "@/lib/user-display";
// Deep import (not @/modules/auth's barrel), the documented CLAUDE.md §3.1
// exception — same reason, and same call, as components/user-menu.tsx: the
// barrel re-exports the Server-Component LoginPage, which pulls next/headers
// into this client bundle and fails the build.
import { logoutRequest } from "@/modules/auth/api/auth.api";
import { WORKSPACE_ROUTES } from "../routes";
import type { SearchDestination } from "../utils/search-destinations";
import { BrandLogo } from "./BrandLogo";
import { HeaderIconButton } from "./HeaderIconButton";
import { HeaderSearch } from "./HeaderSearch";
import { OrgSwitcher } from "./OrgSwitcher";
import { SetupCentreLink } from "./SetupCentreLink";
import { ThemeToggle } from "./ThemeToggle";

type OpenMenu = "create" | "notifications" | "profile" | null;

/** Setu's dropdown panel shell: anchored under the header's right-hand cluster. */
const PANEL_CLASS = `
  absolute
  right-0
  top-[calc(100%+var(--page-pad-y))]
  z-50
  flex
  w-[21rem]
  max-w-[calc(100vw-1.5rem)]
  flex-col
  overflow-hidden
  rounded-xl
  border
  border-[var(--divider)]
  bg-[var(--surface)]
  shadow-xl

  screen-2xl:w-[26rem]
`;

/**
 * The tenant header, on Setu's Header: logo (phones only) · org switcher ·
 * search · right-hand cluster of icon buttons and the profile menu. Setu's
 * dropdown model is kept: one menu open at a time, closed by clicking the
 * backdrop behind it (Escape closes it too).
 *
 * Boss content in Setu's slots: the org switcher and Setup Centre link are
 * Boss's own header items; Setu's apps launcher is not ported; "+" and the bell
 * have no backing feature yet, so their panels say so instead of faking
 * content (and the bell carries no unread dot).
 */
export function WorkspaceHeader({
  organizations,
  financialYears = [],
  activeFinancialYearStart,
  branches = [],
  canViewBranches = false,
  branchesSetupHref,
  activeBranchId = null,
  workspaceName,
  activeOrganizationId,
  user,
  profileHref,
  searchDestinations,
}: {
  organizations: WorkspaceOrganization[];
  /** The active organization's real years (from the API); the menu's Financial year section is hidden when empty. */
  financialYears?: FinancialYearRecord[];
  activeFinancialYearStart?: number;
  /** Active branches the member may list; with none, the Branch section is hidden unless `canViewBranches` (then it says "No branches yet"). */
  branches?: WorkspaceBranch[];
  /** The member holds the Branch read key organization-wide, so an empty list means the organization has no branches yet. */
  canViewBranches?: boolean;
  /** Link to the Setup Centre's Branches page; given only when the member can open it. */
  branchesSetupHref?: string;
  /** Null means "All branches". */
  activeBranchId?: string | null;
  workspaceName?: string;
  /** Null when the user has no organization: the switcher is then not shown. */
  activeOrganizationId: string | null;
  user: { name: string; email: string; roleLabel: string };
  /** Where "Profile" goes. Omit it and the item isn't rendered — a user with no
   *  real profile page must not get a dead link. */
  profileHref?: string;
  searchDestinations: SearchDestination[];
}) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  function toggle(menu: Exclude<OpenMenu, null>) {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  useEffect(() => {
    if (!openMenu) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openMenu]);

  return (
    <header
      className="
        relative z-30 flex shrink-0 items-center
        h-[var(--header-h)]
        gap-2
        bg-[var(--shell-bg)]
        pl-3

        screen-lg:pl-4
        screen-2xl:pl-5

        screen-sm:mr-4
        screen-2xl:mr-4
      "
    >
      {/* Backdrop to close menus */}
      {openMenu && <div data-testid="header-backdrop" className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />}

      {/* Logo — the rail carries it from screen-sm up; below that the rail is a
          bottom tab bar with no room for branding, so the header picks it up. */}
      <Link href={WORKSPACE_ROUTES.dashboard} aria-label="Boss dashboard" className="flex shrink-0 items-center screen-sm:hidden">
        <BrandLogo className="h-[1.75rem] w-[1.75rem]" />
      </Link>

      {/* The ONE connected control for organization, financial year and branch (year and branch are view preferences the
          server re-validates; keyed by organization so a switch starts from a clean menu). Shown whenever there is an organization to name — not only for users
          with 2+ — so a single-org user can still see where they are. min-w-0 +
          a cap so a long name shrinks instead of crowding out the search. */}
      {activeOrganizationId && (
        <div className="min-w-0 w-[12rem] shrink-0 screen-sm:ml-1 screen-sm:w-[16rem]">
          <OrgSwitcher key={activeOrganizationId} workspaceName={workspaceName} financialYears={financialYears} activeFinancialYearStart={activeFinancialYearStart} branches={branches} canViewBranches={canViewBranches} branchesSetupHref={branchesSetupHref} activeBranchId={activeBranchId} organizations={organizations} activeOrganizationId={activeOrganizationId} onOpen={() => setOpenMenu(null)} closeRequested={openMenu !== null} />
        </div>
      )}

      <HeaderSearch destinations={searchDestinations} />

      {/* Right side actions — h-full so this row's bottom edge matches the header's,
          which the dropdown tops key off to line up with where the page content
          starts below the header. */}
      <div className="relative ml-auto flex h-full shrink-0 items-center gap-1.5 screen-sm:gap-2">
        {/* Create */}
        <div className="hidden h-full items-center screen-sm:flex">
          <HeaderIconButton label="Quick create" expanded={openMenu === "create"} onClick={() => toggle("create")}>
            <Plus color="var(--text-secondary)" size={20} />
          </HeaderIconButton>

          {openMenu === "create" && (
            <div className={PANEL_CLASS}>
              <PanelHeading title="Quick create" />
              <PanelEmpty text="No quick actions available yet." />
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="hidden h-full items-center screen-sm:flex">
          <HeaderIconButton label="Notifications" expanded={openMenu === "notifications"} onClick={() => toggle("notifications")}>
            <Bell color="var(--text-secondary)" size={20} />
          </HeaderIconButton>

          {openMenu === "notifications" && (
            <div className={PANEL_CLASS}>
              <PanelHeading title="Notifications" />
              <PanelEmpty text="No notifications yet." />
            </div>
          )}
        </div>

        {/* Setup Centre — Boss's own header item, in the slot Setu gives its apps launcher. */}
        <SetupCentreLink />

        {/* Profile */}
        <div>
          <ProfileButton name={user.name} role={readableRole(user.roleLabel)} expanded={openMenu === "profile"} onClick={() => toggle("profile")} />

          {openMenu === "profile" && (
            <ProfilePanel user={user} profileHref={profileHref} onNavigate={() => setOpenMenu(null)} />
          )}
        </div>
      </div>
    </header>
  );
}

function PanelHeading({ title }: { title: string }) {
  return (
    <div className="flex shrink-0 items-center justify-between px-4 py-3.5">
      <p className="text-base font-semibold text-[var(--text-heading)]">{title}</p>
    </div>
  );
}

/** An honest empty state in Setu's panel typography: nothing is backing the panel yet. */
function PanelEmpty({ text }: { text: string }) {
  return <p className="border-t border-[var(--divider)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">{text}</p>;
}

function ProfileButton({ name, role, expanded, onClick }: { name: string; role: string; expanded: boolean; onClick: () => void }) {
  return <button type="button" title={name} aria-label={`Account menu: ${name}, ${role}`} aria-expanded={expanded} onClick={onClick} className="tap-pop flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--workspace-pill-border)] bg-[var(--avatar-bg)] text-xs font-semibold text-[var(--avatar-text)] transition-colors hover:bg-[var(--search-bg)]">{initialsOf(name)}</button>;
}

function ProfilePanel({
  user,
  profileHref,
  onNavigate,
}: {
  user: { name: string; email: string; roleLabel: string };
  profileHref?: string;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      try {
        await logoutRequest();
        router.push("/login");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Sign out failed");
      }
    });
  }

  return (
    <div role="region" aria-label="Account" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[20rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--surface)] text-[var(--text-heading)] shadow-xl">
      <div className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--avatar-bg)] text-sm font-semibold text-[var(--avatar-text)]">{initialsOf(user.name)}</span>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold">{user.name}</p>
          <p className="break-words text-xs text-[var(--text-muted)]">{user.email}</p>
          <p className="text-xs text-[var(--text-muted)]">{readableRole(user.roleLabel)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-[var(--divider)] px-4 py-3"><span className="text-xs">Appearance</span><ThemeToggle /></div>
      <div className="border-t border-[var(--divider)] p-1.5">
        {profileHref && <Link href={profileHref} aria-label="Profile" onClick={onNavigate} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-xs hover:bg-[var(--search-bg)]"><UserRound size={18} aria-hidden="true" />View account</Link>}
        <Link href={WORKSPACE_ROUTES.setup} onClick={onNavigate} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-xs hover:bg-[var(--search-bg)]"><Settings size={18} aria-hidden="true" />Settings</Link>
      </div>
      <div className="border-t border-[var(--divider)] p-1.5"><button type="button" onClick={signOut} disabled={pending} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-xs text-[var(--status-critical-fg)] hover:bg-[var(--search-bg)] disabled:opacity-60"><LogOut size={18} aria-hidden="true" />{pending ? "Signing out…" : "Sign out"}</button></div>
    </div>
  );
}
