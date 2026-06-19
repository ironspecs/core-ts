import { useState } from "react";

import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { KeyValuePairsField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";
import { Typography } from "@core-ts/react";

function normalize(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof k === "string" && typeof val === "string") out[k] = val;
  }
  return out;
}

export function KeyValuePairs(props: FieldComponentProps<KeyValuePairsField>) {
  const { field, name, context } = props;
  const { input } = useField<unknown>(name, { subscription: { value: true } });

  const obj = normalize(input.value);
  const entries = Object.entries(obj);

  const [k, setK] = useState("");
  const [v, setV] = useState("");

  function add() {
    const key = k.trim();
    if (!key) return;
    input.onChange({ ...obj, [key]: v });
    setK("");
    setV("");
  }

  function remove(key: string) {
    const next = { ...obj };
    delete next[key];
    input.onChange(next);
  }

  function update(key: string, nextVal: string) {
    input.onChange({ ...obj, [key]: nextVal });
  }

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className="space-y-2">
        <div className="border-base-300 rounded-box overflow-x-auto border-(length:--border)">
          <table className="table-sm table">
            <thead>
              <tr>
                <th className="w-56">{field.keyLabel}</th>
                <th>{field.valueLabel}</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {entries.length ? (
                entries.map(([key, val]) => (
                  <tr key={key}>
                    <td>
                      <Typography variant="mono" size="sm">
                        {key}
                      </Typography>
                    </td>
                    <td>
                      <input
                        className="input input-bordered input-sm w-full"
                        disabled={field.disabled}
                        value={val}
                        onChange={(e) => update(key, e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={field.disabled}
                        onClick={() => remove(key)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>
                    <Typography variant="body" muted>
                      {context.fieldLabels?.noEntries}
                    </Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex gap-2">
          <input
            className="input input-bordered w-56"
            disabled={field.disabled}
            value={k}
            onChange={(e) => setK(e.target.value)}
            placeholder={field.keyPlaceholder}
          />
          <input
            className="input input-bordered w-full"
            disabled={field.disabled}
            value={v}
            onChange={(e) => setV(e.target.value)}
            placeholder={field.valuePlaceholder}
          />
          <button
            type="button"
            className="btn btn-outline"
            disabled={field.disabled}
            onClick={add}
          >
            {context.fieldLabels?.add}
          </button>
        </div>
      </div>
    </FieldFrame>
  );
}
