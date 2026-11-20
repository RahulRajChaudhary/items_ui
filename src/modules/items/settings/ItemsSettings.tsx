"use client";
import { useState } from "react";
import { Tabs } from "@/shared/ui/Tabs";
import { FieldsTab } from "./FieldsTab";
import { PreferencesTab } from "./PreferencesTab";
import { SettingsListTab } from "./SettingsListTab";
import { SETTINGS_LISTS } from "./settingsLists";

const TABS = ["Preferences", "Fields", "Validation Rules", "Record Locking", "Buttons", "Related Lists"].map((t) => ({ id: t, label: t }));

/**
 * Module Settings > Items: header, six tabs, and the active tab. Preferences has a sticky Save/Cancel footer.
 * Every tab loads and saves through the API (Preferences, Fields and the four list tabs).
 */
export function ItemsSettings() {
  const [tab, setTab] = useState("Preferences");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h2 className="m-0 px-5 pb-1 pt-5 text-[1.5rem] font-medium">Items</h2>
      <div className="px-2.5"><Tabs tabs={TABS} activeId={tab} onChange={setTab} label="Items settings" /></div>
      {tab === "Preferences" ? <PreferencesTab /> : tab === "Fields" ? <FieldsTab /> : <SettingsListTab key={tab} list={SETTINGS_LISTS.find((l) => l.tab === tab) ?? SETTINGS_LISTS[0]!} />}
    </div>
  );
}

