import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { FeatureChecklistField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";
import { Typography } from "@core-ts/react";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string") as string[];
}

/**
 * Checkbox column alignment:
 *
 * - Left slot has fixed width and never grows
 * - Label/description area can grow
 */
const CHECK_SLOT_CLASS = "w-6 flex-none flex items-start justify-center pt-1";

export function FeatureChecklist(
  props: FieldComponentProps<FeatureChecklistField>,
) {
  const { field, name } = props;
  const { input } = useField<unknown>(name, { subscription: { value: true } });

  const enabled = asStringArray(input.value);

  function toggleFeature(value: string, nextChecked: boolean) {
    if (nextChecked) {
      if (enabled.includes(value)) return;
      input.onChange([...enabled, value]);
      return;
    }
    input.onChange(enabled.filter((x) => x !== value));
  }

  const cols = field.columns ?? 1;
  const gridClass = cols === 2 ? "grid grid-cols-2 gap-3" : "space-y-3";

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className={gridClass}>
        {field.options.map((opt) => {
          const checked = enabled.includes(opt.value);
          const disabled = !!field.disabled || !!opt.disabled;

          const row = (
            <label
              key={opt.value}
              className="flex cursor-pointer gap-3 select-none"
            >
              <span className={CHECK_SLOT_CLASS}>
                <input
                  type="checkbox"
                  className="checkbox"
                  disabled={disabled}
                  checked={checked}
                  onChange={(e) => toggleFeature(opt.value, e.target.checked)}
                  onBlur={input.onBlur}
                  onFocus={input.onFocus}
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block">
                  <Typography variant="body">{opt.label}</Typography>
                </span>
                {opt.description ? (
                  <span className="block">
                    <Typography variant="hint">{opt.description}</Typography>
                  </span>
                ) : null}
              </span>
            </label>
          );

          return cols === 2 ? <div key={opt.value}>{row}</div> : row;
        })}
      </div>
    </FieldFrame>
  );
}
