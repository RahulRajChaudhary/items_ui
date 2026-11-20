"use client";
import { Suspense, use, type ReactNode } from "react";
import { notFound, useRouter } from "next/navigation";
import { ItemsFrame } from "@/modules/items/components/ItemsFrame";
import { ItemsProvider } from "@/modules/items/ItemsProvider";
import { ItemForm } from "@/modules/items/features/items/ItemForm";
import { ItemsScreen } from "@/modules/items/features/items/ItemsScreen";
import { ENTITIES } from "@/modules/items/features/records/entities";
import { EntityForm, EntityScreen } from "@/modules/items/features/records/EntityScreen";
import { WidgetBuilder } from "@/modules/items/features/records/WidgetBuilder";
import { ITEMS_TAB_SLUGS, tabForSlug, topTab } from "@/modules/items/routes";

/**
 * Route for every Items screen: /items (list), /items/new, /items/edit/<id>, and /items/<tab> for each module tab,
 * with /new and /edit/<id> under it. Tabs other than Items are generated from their config (features/records/entities).
 */
export default function ItemsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const first = slug?.[0];
  const tab = tabForSlug(first);
  if (!tab) notFound();
  const entity = first ? ENTITIES[first] : undefined;
  const second = slug?.[1];
  if (entity && second === "builder" && entity.slug === "widgets" && slug?.[2]) return (
    <ItemsProvider>
      <ItemsFrame activeTab={topTab(tab)} onTab={(id) => router.push(`/items/${ITEMS_TAB_SLUGS[id] ?? ""}`)}>
        <Suspense fallback={<div className="flex-1 p-5 text-mute">Loading...</div>}><WidgetBuilder id={slug[2]} /></Suspense>
      </ItemsFrame>
    </ItemsProvider>
  );
  if (entity && second && second !== "new" && second !== "edit") notFound();

  let screen: ReactNode;
  if (first === "new" || first === "edit") screen = <ItemForm id={first === "edit" ? slug?.[1] : undefined} onDone={(id) => router.push(`/items?item=${id}`)} onCancel={() => router.back()} />;
  else if (entity && second === "new") screen = <EntityForm cfg={entity} />;
  else if (entity && second === "edit") screen = <EntityForm cfg={entity} id={slug?.[2]} />;
  else if (entity) screen = <EntityScreen cfg={entity} />;
  else screen = <ItemsScreen />;

  return (
    <ItemsProvider>
      <ItemsFrame activeTab={topTab(tab)} onTab={(id) => router.push(`/items/${ITEMS_TAB_SLUGS[id] ?? ""}`)}>
        <Suspense fallback={<div className="flex-1 p-5 text-mute">Loading...</div>}>{screen}</Suspense>
      </ItemsFrame>
    </ItemsProvider>
  );
}
