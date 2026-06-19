import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { CronField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";

export function Cron(props: FieldComponentProps<CronField>) {
  const { field, name } = props;
  const { input } = useField<string>(name, { subscription: { value: true } });
  const v = typeof input.value === "string" ? input.value : "";

  const presets = field.presets;

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className="space-y-2">
        <select
          className="select select-bordered w-full whitespace-nowrap"
          disabled={field.disabled}
          value={presets.some((p) => p.value === v) ? v : ""}
          onChange={(e) => input.onChange(e.target.value)}
        >
          <option value="" className="whitespace-nowrap">
            {field.customLabel}
          </option>
          {presets.map((p) => (
            <option key={p.value} value={p.value} className="whitespace-nowrap">
              {p.label}
            </option>
          ))}
        </select>

        <input
          className="input input-bordered w-full font-mono text-sm"
          disabled={field.disabled}
          value={v}
          onChange={(e) => input.onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      </div>
    </FieldFrame>
  );
}
