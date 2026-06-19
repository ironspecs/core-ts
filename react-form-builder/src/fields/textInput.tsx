import { useField } from "react-final-form";
import type { TextInputField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";
import { pickError } from "../useFinalError.js";

type TextInputProps = {
  field: TextInputField;
  name: string;
};
export function TextInput(props: TextInputProps) {
  const { field, name } = props;

  const { input, meta } = useField<string>(name, {
    subscription: {
      value: true,
      error: true,
      submitError: true,
      touched: true,
      dirty: true,
    },
  });

  const value = typeof input.value === "string" ? input.value : "";

  const err = pickError(meta);
  const showError = (meta.touched || meta.dirty) && err;

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
      error={showError ? err : undefined}
    >
      <input
        className="input input-bordered w-full"
        type="text"
        data-testid={field["data-testid"]}
        disabled={field.disabled}
        value={value}
        onChange={(e) => input.onChange(e.target.value)}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
      />
    </FieldFrame>
  );
}
