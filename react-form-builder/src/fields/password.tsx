import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { PasswordField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";
import { pickError } from "../useFinalError.js";

export function Password(props: FieldComponentProps<PasswordField>) {
  const { field, name } = props;
  const { input, meta } = useField<string>(name, {
    subscription: {
      value: true,
      touched: true,
      error: true,
      submitError: true,
    },
  });

  const err = pickError(meta);
  const showErr = meta.touched && err;

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
      error={showErr ? err : undefined}
    >
      <input
        className="input input-bordered w-full"
        type="password"
        disabled={field.disabled}
        value={typeof input.value === "string" ? input.value : ""}
        onChange={(e) => input.onChange(e.target.value)}
        onBlur={input.onBlur}
        onFocus={input.onFocus}
      />
    </FieldFrame>
  );
}
