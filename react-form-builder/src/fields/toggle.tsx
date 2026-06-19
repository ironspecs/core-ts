import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { ToggleField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";

export function Toggle(props: FieldComponentProps<ToggleField>) {
  const { field, name } = props;
  const { input } = useField<boolean>(name, { subscription: { value: true } });
  const checked = !!input.value;

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <label className="label cursor-pointer justify-start gap-3">
        <input
          type="checkbox"
          className="toggle"
          disabled={field.disabled}
          checked={checked}
          onChange={(e) => input.onChange(e.target.checked)}
          onBlur={input.onBlur}
          onFocus={input.onFocus}
        />
        {field.label ? <span className="label-text">{field.label}</span> : null}
      </label>
    </FieldFrame>
  );
}
