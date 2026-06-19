import type {
  EnumOption,
  RelationSpec,
  SharedFieldBase,
} from "./sharedSchema.js";

/**
 * `ViewerSchema` is the read-only mirror of the form-builder schema.
 *
 * It is intentionally limited to record presentation concerns: section
 * structure, field labels, and display formatting. Route actions, mutations,
 * and page composition belong outside the viewer.
 *
 * If the form builder grows a new field that should be viewable here, add the
 * field kind intentionally and update `RecordFormViewer` in the same change.
 */
export type ViewerFieldKind =
  | "heading"
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "enum"
  | "timestamp"
  | "readonly"
  | "stringArray"
  | "relation";

export type ViewerFieldSchema = SharedFieldBase & {
  id: string; // stable key for React
  kind: ViewerFieldKind;

  /**
   * Metadata here exists only to preserve display fidelity with the form
   * schema. It must not be used to smuggle edit controls or page actions into
   * the viewer.
   */
  placeholder?: string;

  /** Optional formatting for display (readonly/timestamp). */
  format?: (value: unknown) => string;

  /** For enums */
  options?: EnumOption[];

  /** For numbers */
  min?: number;
  max?: number;
  step?: number;

  /** For arrays */
  array?: {
    labels?: {
      add?: string;
      empty?: string;
    };
    itemPlaceholder?: string;
    maxItems?: number;
    minItems?: number;
  };

  /** For relations */
  relation?: RelationSpec;
};

export type ViewerSectionSchema = {
  type: "section";
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  fields: ViewerFieldSchema[];
};
export type ViewerSchema = ViewerSectionSchema;
