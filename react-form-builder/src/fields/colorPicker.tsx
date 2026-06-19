import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { ColorPickerField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";

export function ColorPicker(props: FieldComponentProps<ColorPickerField>) {
  const { field, name } = props;
  const { input } = useField<string | null>(name, {
    subscription: { value: true },
  });
  const v = typeof input.value === "string" ? input.value : "#000000";

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className="flex items-center gap-3">
        <input
          className="input input-bordered w-full"
          disabled={field.disabled}
          value={typeof input.value === "string" ? input.value : ""}
          onChange={(e) => input.onChange(e.target.value)}
          placeholder={field.placeholder}
        />
        <input
          type="color"
          disabled={field.disabled}
          value={v}
          onChange={(e) => input.onChange(e.target.value)}
        />
      </div>
    </FieldFrame>
  );
}
