import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { DateField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";

function toYmd(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = String(d.getFullYear()).padStart(4, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DateInput(props: FieldComponentProps<DateField>) {
  const { field, name } = props;
  const { input } = useField<string | null>(name, {
    subscription: { value: true },
  });
  const v = typeof input.value === "string" ? toYmd(input.value) : "";

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <input
        className="input input-bordered w-full"
        type="date"
        disabled={field.disabled}
        value={v}
        onChange={(e) => input.onChange(e.target.value || null)}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
      />
    </FieldFrame>
  );
}
