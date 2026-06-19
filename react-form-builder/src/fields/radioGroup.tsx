import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { RadioGroupField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";

export function RadioGroup(props: FieldComponentProps<RadioGroupField>) {
  const { field, name } = props;
  const { input } = useField<string>(name, { subscription: { value: true } });
  const v = typeof input.value === "string" ? input.value : "";

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className="space-y-2">
        {field.options.map((opt) => (
          <label
            key={opt.value}
            className="label cursor-pointer justify-start gap-3"
          >
            <input
              type="radio"
              className="radio"
              disabled={field.disabled}
              checked={v === opt.value}
              onChange={() => input.onChange(opt.value)}
            />
            <span className="label-text">{opt.label}</span>
          </label>
        ))}
      </div>
    </FieldFrame>
  );
}
