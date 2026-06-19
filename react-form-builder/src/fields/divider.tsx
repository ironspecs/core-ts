import type { FieldComponentProps } from "../registryTypes.js";
import type { DividerField } from "../schema.js";

export function Divider(props: FieldComponentProps<DividerField>) {
  const { field } = props;
  return <div className="divider">{field.label}</div>;
}
