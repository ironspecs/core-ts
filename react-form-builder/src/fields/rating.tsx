import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { RatingField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";

export function Rating(props: FieldComponentProps<RatingField>) {
  const { field, name } = props;
  const { input } = useField<number | null>(name, {
    subscription: { value: true },
  });

  const max = field.max ?? 5;
  const val =
    typeof input.value === "number" && Number.isFinite(input.value)
      ? input.value
      : 0;

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className="flex items-center gap-2">
        {Array.from({ length: max }).map((_, i) => {
          const n = i + 1;
          const active = n <= val;
          return (
            <button
              key={n}
              type="button"
              className={active ? "btn btn-primary" : "btn btn-outline"}
              disabled={field.disabled}
              onClick={() => input.onChange(n)}
            >
              {n}
            </button>
          );
        })}
        {field.clearLabel ? (
          <button
            type="button"
            className="btn"
            disabled={field.disabled}
            onClick={() => input.onChange(null)}
          >
            {field.clearLabel}
          </button>
        ) : null}
      </div>
    </FieldFrame>
  );
}
