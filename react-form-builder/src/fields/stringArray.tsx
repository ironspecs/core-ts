import { useState } from "react";

import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { StringArrayField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";
import { Typography } from "@core-ts/react";

function normalize(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string") as string[];
}

export function StringArray(props: FieldComponentProps<StringArrayField>) {
  const { field, name, context } = props;
  const { input } = useField<unknown>(name, { subscription: { value: true } });
  const items = normalize(input.value);

  const [draft, setDraft] = useState("");

  function add() {
    const t = draft.trim();
    if (!t) return;
    if (items.includes(t)) {
      setDraft("");
      return;
    }
    input.onChange([...items, t]);
    setDraft("");
  }

  function remove(x: string) {
    input.onChange(items.filter((i) => i !== x));
  }

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            className="input input-bordered w-full"
            disabled={field.disabled}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
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

        <div className="flex flex-wrap gap-2">
          {items.length ? (
            items.map((x) => (
              <span key={x} className="badge badge-outline gap-2">
                {x}
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={field.disabled}
                  onClick={() => remove(x)}
                >
                  ✕
                </button>
              </span>
            ))
          ) : (
            <div>
              <Typography variant="body" muted>
                {context.fieldLabels?.noEntries}
              </Typography>
            </div>
          )}
        </div>
      </div>
    </FieldFrame>
  );
}
