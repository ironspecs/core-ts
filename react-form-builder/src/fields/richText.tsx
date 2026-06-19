import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { RichTextField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";

export function RichText(props: FieldComponentProps<RichTextField>) {
  const { field, name } = props;
  const { input } = useField<string>(name, { subscription: { value: true } });

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <textarea
        className="textarea textarea-bordered min-h-32 w-full"
        disabled={field.disabled}
        value={typeof input.value === "string" ? input.value : ""}
        onChange={(e) => input.onChange(e.target.value)}
      />
    </FieldFrame>
  );
}
