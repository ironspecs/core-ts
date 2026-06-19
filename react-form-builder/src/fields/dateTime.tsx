import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { DateTimeField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";

export function DateTimeInput(props: FieldComponentProps<DateTimeField>) {
  const { field, name } = props;
  const { input } = useField<string | null>(name, {
    subscription: { value: true },
  });
  const v = typeof input.value === "string" ? input.value : "";

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <input
        className="input input-bordered w-full"
        type="datetime-local"
        disabled={field.disabled}
        value={v}
        onChange={(e) => input.onChange(e.target.value || null)}
      />
    </FieldFrame>
  );
}
