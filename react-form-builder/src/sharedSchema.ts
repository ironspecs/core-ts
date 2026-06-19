export type SharedFieldBase = {
  path: string;
  label?: string;
  description?: string;
  required?: boolean;
  "data-testid"?: string;
};

export type EnumOption = { value: string; label: string };

export type RelationSpec = {
  resourceLabel: string;
  onOpen?: (id: string) => void;
};
