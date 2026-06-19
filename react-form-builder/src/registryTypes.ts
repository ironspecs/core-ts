import type { ComponentType } from "react";
import type { Field } from "./schema.js";

export type FormFieldLabels = {
  loading: string;
  noResults: string;
  noChanges: string;
  noEntries: string;
  noSelection: string;
  noImage: string;
  add: string;
  original: string;
  draft: string;
};

export type FormContext = {
  onAction?: (args: { id: string; path: string }) => void;
  loadOptions?: (args: {
    sourceId: string;
    query: string;
  }) => Promise<{ label: string; value: string }[]>;
  fieldLabels?: FormFieldLabels;
  [key: string]: unknown;
};

export type FieldComponentProps<F extends Field = Field> = {
  field: F;
  name: string;

  // needed for container fields that render children
  registry: Registry;

  context: FormContext;
};

export type FieldComponent<F extends Field = Field> = ComponentType<
  FieldComponentProps<F>
>;

// Registry maps field type names to their component implementations.
// Uses a bivariant method type to allow components with narrower field types
// to be assigned. This is the standard TypeScript pattern for plugin registries
// where runtime dispatch (via field.type) ensures type safety.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Registry = Record<string, FieldComponent<any>>;
