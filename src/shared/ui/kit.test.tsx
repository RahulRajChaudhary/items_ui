import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "./DataTable";
import { DropdownMenu } from "./DropdownMenu";
import { Modal } from "./Modal";

describe("DropdownMenu", () => {
  it("opens, picks an item and closes", () => {
    const onSelect = vi.fn();
    render(<DropdownMenu triggerLabel="More" trigger="..." groups={[{ items: [{ id: "a", label: "Import", onSelect }] }]} />);
    fireEvent.click(screen.getByLabelText("More"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Import" }));
    expect(onSelect).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });
  it("closes on Escape", () => {
    render(<DropdownMenu triggerLabel="More" trigger="..." groups={[{ items: [{ id: "a", label: "Import", onSelect: () => {} }] }]} />);
    fireEvent.click(screen.getByLabelText("More"));
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("Modal", () => {
  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(<Modal title="T" open onClose={onClose}>body</Modal>);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});

describe("DataTable", () => {
  const base = { columns: [], rows: [], rowKey: () => "", wrap: false, onRetry: () => {}, emptyState: <div>EMPTY</div>, page: { page: 1, perPage: 25, hasMore: false, onChange: () => {} } };
  it("shows the empty state", () => {
    render(<DataTable<never> {...base} state="empty" />);
    expect(screen.getByText("EMPTY")).toBeInTheDocument();
  });
  it("shows an error with retry", () => {
    const onRetry = vi.fn();
    render(<DataTable<never> {...base} state="error" onRetry={onRetry} />);
    fireEvent.click(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalled();
  });
});
