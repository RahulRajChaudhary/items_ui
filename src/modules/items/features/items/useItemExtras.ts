"use client";
import { useRecords } from "../records/hooks";

/**
 * What Items settings add to the Items screens, read in one place: which built-in fields are active or mandatory
 * (item form), the extra custom fields (item form), whether any lock configuration exists (Lock item menu),
 * the custom buttons (item header) and the related lists (item tabs). Screens ask this hook and never read the
 * settings records themselves.
 */
export function useItemExtras() {
  const fields = useRecords("fields");
  const locks = useRecords("locks", { filter_by: "Active" });
  const buttons = useRecords("buttons", { filter_by: "Active" });
  const related = useRecords("related", { filter_by: "Active" });
  const all = fields.data?.records ?? [];
  const find = (name: string) => all.find((f) => f.name === name);
  return {
    /** A built-in field is shown unless it was marked inactive in settings. While settings load, everything shows. */
    isActive: (name: string) => find(name)?.status !== "inactive",
    isMandatory: (name: string) => find(name)?.mandatory === true,
    /** Active custom fields created by the user (not built-in). */
    customFields: all.filter((f) => f.std !== true && f.status === "active"),
    lockEnabled: (locks.data?.records.length ?? 0) > 0,
    buttons: buttons.data?.records ?? [],
    relatedLists: related.data?.records ?? [],
  };
}
