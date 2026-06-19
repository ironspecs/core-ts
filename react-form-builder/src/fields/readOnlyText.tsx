import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { ReadOnlyTextField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";

function toDisplay(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return "";
  }
}

export function ReadOnlyText(props: FieldComponentProps<ReadOnlyTextField>) {
  const { field, name } = props;
  const { input } = useField<unknown>(name, { subscription: { value: true } });

  const text = toDisplay(input.value);
  const shown = text.length ? text : (field.emptyText ?? null);

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div
        className={[
          "input input-bordered flex w-full items-center",
          "opacity-80",
          field.monospace ? "font-mono text-xs" : "",
        ].join(" ")}
        // Not an <input>, so no accidental edits.
        aria-readonly="true"
      >
        <span className="truncate">{shown}</span>
      </div>
    </FieldFrame>
  );
}
