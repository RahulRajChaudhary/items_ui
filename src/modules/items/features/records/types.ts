import type { ReactNode } from "react";
import type { RecordDto, ResourceName, RowValue } from "../../api/resources";

export type Values = Record<string, unknown>;

/** One input of a generated form. The same definition draws the input, its label, its validation and its read-only value. */
export type FieldDef = {
  key: string;
  label: string;
  kind: "text" | "number" | "money" | "select" | "textarea" | "switch" | "radio" | "date" | "rows";
  required?: boolean;
  options?: string[];
  /** Fill the options from another resource's record names (a Product list). */
  optionsFrom?: ResourceName;
  hint?: string;
  prefix?: string;
  max?: number;
  /** Hide the field (and skip its validation) unless this returns true for the current values. */
  showIf?: (v: Values) => boolean;
  /** Columns of a `rows` field (a table the user adds rows to). */
  rows?: FieldDef[];
  addLabel?: string;
};

/** A block of fields; sections with the same `tab` appear together under one tab of the form. */
export type SectionDef = { title?: string; tab?: string; fields: FieldDef[] };

export type ColumnDef = { key: string; label: string; align?: "left" | "right"; money?: boolean; badge?: boolean };

/** What a detail pane shows besides its header: a list of label/value pairs, a table of rows, or an empty message. */
export type DetailTab =
  | { id: string; label: string; kind: "fields"; fields: { label: string; key: string; money?: boolean }[] }
  | { id: string; label: string; kind: "rows"; rowsKey: string; columns: ColumnDef[]; empty: string; counted?: boolean }
  | { id: string; label: string; kind: "empty"; title: string; text?: string; actions?: string[] }
  | { id: string; label: string; kind: "activity" };

/** Everything that makes one module tab (Plans, Coupons, BOM...) a screen. Screens are data: add a config, not a component. */
export type EntityConfig = {
  slug: string;
  resource: ResourceName;
  label: string;
  singular: string;
  /** `split` opens a record beside the list; `table` is list only (row actions instead of a detail pane). */
  layout: "split" | "table";
  filters: { id: string; label: string }[];
  defaultFilter: string;
  columns: ColumnDef[];
  /** Compact left-list lines in split layout. */
  rowTitle: (r: RecordDto) => ReactNode;
  rowSub?: (r: RecordDto) => ReactNode;
  headline?: (r: RecordDto) => ReactNode;
  summary?: { label: string; key: string; money?: boolean }[];
  tabs: DetailTab[];
  sections: SectionDef[];
  empty: { title: string; text: string; actions?: string[]; diagram?: boolean };
  /** Short sentence for the delete confirmation. */
  deleteText?: (r: RecordDto) => string;
  /** Extra buttons in the detail header (labels only; they report "later phase" unless wired). */
  headerActions?: string[];
  /** A link under the title to a sibling list (Plans -> Products). */
  sibling?: { label: string; slug: string };
  modalForm?: boolean;
  /** Defaults for a new record. */
  defaults?: Values;
  /** Fills computed fields (like a price list's details sentence) just before saving. */
  derive?: (body: Values) => Values;
  /** A note shown after a new record is created (used where the next screen is not captured yet). */
  afterCreateNote?: string;
  /** Where to go after a new record is saved (the widget builder). */
  afterCreate?: (id: string) => string;
};

export type { RecordDto, RowValue };
