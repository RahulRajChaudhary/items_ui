import { Button } from "./Button";

/**
 * Footer of every paged list: Total Count, rows-per-page selector, previous/next and the page number.
 * Paging is server side: this only reports `onChange`. Used by the table and by the grid and split list views.
 */
export function Pager({ page, perPage, total, hasMore, onChange }: { page: number; perPage: number; total?: number; hasMore: boolean; onChange: (p: { page: number; perPage: number }) => void }) {
  return (
    <div className="flex flex-none items-center gap-2 border-t border-line px-3.5 py-2.5">
      <span className="text-mute">Total Count: {total ?? "-"}</span>
      <span className="flex-1" />
      <label className="flex items-center gap-1.5">
        <span className="sr-only">Rows per page</span>
        <select value={perPage} onChange={(e) => onChange({ page: 1, perPage: Number(e.target.value) })} className="rounded border border-line bg-panel px-1 py-0.5">
          {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n} per page</option>)}
        </select>
      </label>
      <Button compact aria-label="Previous page" disabled={page <= 1} onClick={() => onChange({ page: page - 1, perPage })}>‹</Button>
      <span className="text-mute">Page {page}</span>
      <Button compact aria-label="Next page" disabled={!hasMore} onClick={() => onChange({ page: page + 1, perPage })}>›</Button>
    </div>
  );
}
