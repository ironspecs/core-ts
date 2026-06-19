import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { BooleanField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";

export function BooleanCheckbox(props: FieldComponentProps<BooleanField>) {
  const { field, name } = props;
  const { input } = useField<boolean>(name, { subscription: { value: true } });

  const checked = !!input.value;

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <span className="mx-4 inline-block">
        <input
          type="checkbox"
          className="checkbox"
          disabled={field.disabled}
          checked={checked}
          onChange={(e) => input.onChange(e.target.checked)}
          onBlur={input.onBlur}
          onFocus={input.onFocus}
        />
      </span>
    </FieldFrame>
  );
}
