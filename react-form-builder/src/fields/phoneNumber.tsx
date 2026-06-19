import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { PhoneNumberField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";

export function PhoneNumber(props: FieldComponentProps<PhoneNumberField>) {
  const { field, name } = props;
  const { input } = useField<string>(name, { subscription: { value: true } });

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <input
        className="input input-bordered w-full"
        type="tel"
        disabled={field.disabled}
        value={typeof input.value === "string" ? input.value : ""}
        onChange={(e) => input.onChange(e.target.value)}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
      />
    </FieldFrame>
  );
}
