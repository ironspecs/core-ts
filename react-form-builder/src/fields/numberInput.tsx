import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { NumberField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";
import { pickError } from "../useFinalError.js";

export function NumberInput(props: FieldComponentProps<NumberField>) {
  const { field, name } = props;
  const { input, meta } = useField<number | null>(name, {
    subscription: {
      value: true,
      touched: true,
      error: true,
      submitError: true,
    },
  });

  const err = pickError(meta);
  const showErr = meta.touched && err;

  const value =
    typeof input.value === "number" && Number.isFinite(input.value)
      ? String(input.value)
      : "";

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
      error={showErr ? err : undefined}
    >
      <input
        className="input input-bordered w-full"
        type="number"
        disabled={field.disabled}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return input.onChange(null);
          const n = Number(raw);
          if (!Number.isFinite(n)) return;
          input.onChange(n);
        }}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
      />
    </FieldFrame>
  );
}
