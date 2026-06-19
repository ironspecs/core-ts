import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { SelectField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";
import { pickError } from "../useFinalError.js";

export function Select(props: FieldComponentProps<SelectField>) {
  const { field, name } = props;
  const { input, meta } = useField<string>(name, {
    subscription: {
      value: true,
      touched: true,
      error: true,
      submitError: true,
    },
  });

  const v = typeof input.value === "string" ? input.value : "";
  const err = pickError(meta);
  const showErr = meta.touched && err;

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
      error={showErr ? err : undefined}
    >
      <select
        className="select select-bordered w-full whitespace-nowrap"
        disabled={field.disabled}
        value={v}
        onChange={(e) => input.onChange(e.target.value)}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
      >
        <option value="" disabled className="whitespace-nowrap">
          {field.placeholder}
        </option>
        {field.options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="whitespace-nowrap"
          >
            {opt.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}
