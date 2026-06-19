import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { SliderField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";

export function Slider(props: FieldComponentProps<SliderField>) {
  const { field, name } = props;
  const { input } = useField<number | null>(name, {
    subscription: { value: true },
  });

  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const val =
    typeof input.value === "number" && Number.isFinite(input.value)
      ? input.value
      : min;

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <input
        className="range w-full"
        type="range"
        disabled={field.disabled}
        min={min}
        max={max}
        value={val}
        onChange={(e) => input.onChange(Number(e.target.value))}
      />
    </FieldFrame>
  );
}
