import { useState } from "react";

import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { DurationField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";

const FACTOR: Record<string, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
};

export function Duration(props: FieldComponentProps<DurationField>) {
  const { field, name } = props;
  const { input } = useField<number | null>(name, {
    subscription: { value: true },
  });

  const units = field.units;
  const [unit, setUnit] = useState(units[0]);

  const seconds =
    typeof input.value === "number" && Number.isFinite(input.value)
      ? input.value
      : 0;
  const shown = String(seconds / (FACTOR[unit] || 1));

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className="join w-full">
        <input
          className="input input-bordered join-item w-full"
          type="number"
          disabled={field.disabled}
          value={shown}
          onChange={(e) => {
            const raw = e.target.value;
            const n = raw === "" ? 0 : Number(raw);
            if (!Number.isFinite(n)) return;
            input.onChange(n * (FACTOR[unit] || 1));
          }}
        />
        <select
          className="select select-bordered join-item whitespace-nowrap"
          disabled={field.disabled}
          value={unit}
          onChange={(e) => setUnit(e.target.value as (typeof units)[number])}
        >
          {units.map((u) => (
            <option key={u} value={u} className="whitespace-nowrap">
              {field.unitLabels[u]}
            </option>
          ))}
        </select>
      </div>
    </FieldFrame>
  );
}
