import type { SharedFieldBase } from "./sharedSchema.js";

export type FieldBase = SharedFieldBase & {
  type: string;
  key?: string; // optional stable key for react lists
  disabled?: boolean;
  name?: string; // optional override for the field name (instead of deriving from path)
};

export type TextInputField = FieldBase & {
  type: "textInput";
  placeholder?: string;
};

export type EmailInputField = FieldBase & {
  type: "emailInput";
  placeholder?: string;
};

export type NumberField = FieldBase & {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
};

export type ToggleField = FieldBase & {
  type: "toggle";
};

export type SelectOption = { label: string; value: string };

export type SelectField = FieldBase & {
  type: "select";
  options: SelectOption[];
  placeholder: string;
};

export type DividerField = FieldBase & {
  type: "divider";
};

export type SectionField = FieldBase & {
  type: "section";
  fields: Field[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export type FormField = FieldBase & {
  type: "form";
  fields: Field[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export type StringArrayField = FieldBase & {
  type: "stringArray";
  itemLabel?: string; // label for each row
  placeholder?: string;
  minItems?: number;
  maxItems?: number;
};

export type FormArrayField = FieldBase & {
  type: "formArray";
  fields: Field[]; // schema for one item object
  minItems?: number;
  maxItems?: number;
  collapsible?: boolean;
  defaultOpen?: boolean;
  itemLabel: string; // shown per item
  removeLabel: string;
};

export type KeyValuePairsField = FieldBase & {
  type: "keyValuePairs";
  keyLabel: string;
  valueLabel: string;
  keyPlaceholder: string;
  valuePlaceholder: string;
  allowEmptyValues?: boolean; // default true
};

export type BooleanField = FieldBase & {
  type: "boolean";
};

export type DateField = FieldBase & {
  type: "date";
};

export type PasswordField = FieldBase & {
  type: "password";
  placeholder?: string;
};

export type PhoneNumberField = FieldBase & {
  type: "phoneNumber";
  placeholder?: string;
};

export type SliderField = FieldBase & {
  type: "slider";
  min: number;
  max: number;
  step?: number;
};

export type FileUploadField = FieldBase & {
  type: "fileUpload";
  accept?: string; // e.g. "image/*"
  currentLabel: string;
  selectedLabel: string;
  clearLabel: string;
};

export type ColorPickerField = FieldBase & {
  type: "colorPicker";
  placeholder: string;
};

export type MultiSelectField = FieldBase & {
  type: "multiSelect";
  options: SelectOption[];
  placeholder: string;
  clearLabel: string;
  doneLabel: string;
};

export type RichTextField = FieldBase & {
  type: "richText";
  placeholder?: string;
};

export type RadioOption = { label: string; value: string };

export type RadioGroupField = FieldBase & {
  type: "radioGroup";
  options: RadioOption[];
};

export type TimeField = FieldBase & {
  type: "time";
};

export type DateTimeField = FieldBase & {
  type: "dateTime";
};

export type RatingField = FieldBase & {
  type: "rating";
  max?: number; // default 5
  clearLabel?: string;
};

export type JsonField = FieldBase & {
  type: "json";
  placeholder?: string;
  applyLabel: string;
  invalidJsonLabel: string;
};

export type TagsField = FieldBase & {
  type: "tags";
  placeholder: string;
  minItems?: number;
  maxItems?: number;
};

export type DiscriminatingVariant = {
  label: string;
  value: string;
  fields: Field[] | null;
};

export type DiscriminatingFormField = FieldBase & {
  type: "discriminatingForm";
  variants: DiscriminatingVariant[];
  discriminatorLabel?: string;
  discriminatorKey?: string;
  placeholder: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export type TabsTab = {
  label: string;
  value: string; // stable id for the tab
  fields: Field[];
};

export type TabsField = FieldBase & {
  type: "tabs";
  tabs: TabsTab[];
  defaultTab?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export type InlineGroupField = FieldBase & {
  type: "inlineGroup";
  fields: Field[];
};

export type CalloutField = FieldBase & {
  type: "callout";
  tone: "info" | "warning" | "error" | "success";
  text: string;
};

export type ActionSpec = {
  id: string;
  label: string;
  tone?: "primary" | "outline" | "neutral" | "danger";
};
export type ActionsField = FieldBase & {
  type: "actions";
  actions: ActionSpec[];
};

export type SecretTextField = FieldBase & {
  type: "secretText";
  placeholder?: string;
  allowCopy?: boolean;
  showLabel: string;
  hideLabel: string;
  copyLabel: string;
};

export type CodeEditorField = FieldBase & {
  type: "codeEditor";
  placeholder?: string;
  language?: "text" | "json";
  allowFormat?: boolean; // mainly for json
  formatLabel: string;
  applyLabel: string;
  invalidJsonLabel: string;
};

export type DurationField = FieldBase & {
  type: "duration";
  units: Array<"seconds" | "minutes" | "hours" | "days">;
  unitLabels: Record<string, string>;
  storeAs?: "seconds" | "iso"; // default: seconds
};

export type CronField = FieldBase & {
  type: "cron";
  presets: Array<{ label: string; value: string }>;
  customLabel: string;
  placeholder: string;
};

export type IpAllowListField = FieldBase & {
  type: "ipAllowList";
  placeholder: string;
  invalidIpLabel: string;
};

export type ComboBoxField = FieldBase & {
  type: "comboBox";
  options: SelectOption[];
  placeholder: string;
  searchPlaceholder: string;
  clearLabel: string;
  doneLabel: string;
};

export type FeatureChecklistOption = {
  label: string;
  value: string; // stable id, stored in array
  description?: string;
  disabled?: boolean; // per-item override
};

export type FeatureChecklistField = FieldBase & {
  type: "featureChecklist";

  /**
   * Stored value is string[] of enabled features (recommended). Example:
   * ["subscriptions", "audit_logs"]
   */
  options: FeatureChecklistOption[];

  /** Optional UI tweaks */
  columns?: 1 | 2; // default 1
};

export type StatusChecklistItem = {
  label: string;
  path: string; // relative to field path/name, dot format: "email", "webhooks.0.status"
  description?: string;
};

export type StatusChecklistField = FieldBase & {
  type: "statusChecklist";

  /**
   * Items are read at joinName(fieldName, item.path). This field is
   * display-only; it does not modify values.
   */
  items: StatusChecklistItem[];

  /**
   * Map from status string to a React node. Example: { success: <Check/>, fail:
   * <X/> }
   */
  icons: Record<string, React.ReactNode>;

  /** Fallback icon when no match. Example: <span>?</span> */
  defaultIcon: React.ReactNode;

  /** Coercion: if value is not string, choose this key. */
  unknownKey: string;
};

export type ReadOnlyTextField = FieldBase & {
  type: "readOnlyText";

  /**
   * Optional:
   *
   * - If true, render as monospace
   * - If set, overrides how the value is rendered
   */
  monospace?: boolean;

  /** Optional placeholder when value is empty/null/undefined */
  emptyText?: string;
};

export type ImageActionSpec = {
  id: string;
  label: string;
  tone?: "primary" | "outline" | "neutral" | "danger";

  /**
   * Optional payload for the host app to drive a dialog/popup. Example: { kind:
   * "upload", accept: "image/*" }
   */
  data?: Record<string, unknown>;
};

export type ImageUrlField = FieldBase & {
  type: "imageUrl";

  /** UI */
  alt: string;
  aspect?: "square" | "landscape" | "portrait" | "auto"; // default auto
  fit?: "cover" | "contain"; // default cover
  maxHeight?: number; // px, optional
  showUrl?: boolean; // default false

  /**
   * Edit action(s), optional. If present and runtime.onAction exists, show
   * buttons.
   */
  actions?: ImageActionSpec[];

  /**
   * If true, allow clearing the url by setting null. (Still only changed by
   * explicit user click, never by typing.)
   */
  allowClear?: boolean;
  clearLabel?: string; // required when allowClear is true
};

export type AsyncSelectField = FieldBase & {
  type: "asyncSelect";
  sourceId: string;
  placeholder: string;
  searchPlaceholder: string;
  goLabel: string;
  clearLabel: string;
  doneLabel: string;
};

export type SummaryRow = { label: string; path: string };
export type SummaryTableField = FieldBase & {
  type: "summaryTable";
  rows: SummaryRow[];
};

export type DiffPreviewField = FieldBase & {
  type: "diffPreview";
  // compares original vs draft at this path
};

export type Field =
  | TextInputField
  | EmailInputField
  | NumberField
  | ToggleField
  | SelectField
  | MultiSelectField
  | BooleanField
  | DateField
  | DateTimeField
  | TimeField
  | PasswordField
  | PhoneNumberField
  | SliderField
  | FileUploadField
  | ColorPickerField
  | RichTextField
  | RatingField
  | JsonField
  | TagsField
  | RadioGroupField
  | TabsField
  | StringArrayField
  | FormArrayField
  | KeyValuePairsField
  | DiscriminatingFormField
  | DividerField
  | SectionField
  | InlineGroupField
  | CalloutField
  | ActionsField
  | SecretTextField
  | CodeEditorField
  | DurationField
  | CronField
  | IpAllowListField
  | ComboBoxField
  | FeatureChecklistField
  | StatusChecklistField
  | ReadOnlyTextField
  | ImageUrlField
  | AsyncSelectField
  | SummaryTableField
  | DiffPreviewField
  | FormField;

export type FormSchema = Field[];
