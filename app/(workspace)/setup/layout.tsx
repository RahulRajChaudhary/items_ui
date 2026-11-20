import type { ReactNode } from "react";
import { ItemsProvider } from "@/modules/items/ItemsProvider";
import { SettingsFrame } from "@/modules/items/settings/SettingsFrame";

/** Every settings page sits inside the settings frame (title strip + settings menu) and gets the Items module's API. */
export default function SetupLayout({ children }: { children: ReactNode }) {
  return (
    <ItemsProvider>
      <SettingsFrame>{children}</SettingsFrame>
    </ItemsProvider>
  );
}
