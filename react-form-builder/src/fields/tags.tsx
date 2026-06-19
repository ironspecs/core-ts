import { useState } from "react";

import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { TagsField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";
import { Typography } from "@core-ts/react";

function normalize(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string" && x.trim() !== "") as string[];
}

function splitTags(raw: string) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function Tags(props: FieldComponentProps<TagsField>) {
  const { field, name, context } = props;
  const { input } = useField<unknown>(name, { subscription: { value: true } });
  const items = normalize(input.value);
  const [draft, setDraft] = useState("");

  function addMany(values: string[]) {
    const set = new Set(items);
    for (const v of values) set.add(v);
    input.onChange(Array.from(set));
  }

  function addFromDraft() {
    const vs = splitTags(draft);
    if (!vs.length) return;
    addMany(vs);
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

        <div className="flex gap-2">
          <input
            className="input input-bordered w-full"
            disabled={field.disabled}
            value={draft}
            placeholder={field.placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFromDraft();
              }
            }}
          />
          <button
            type="button"
            className="btn btn-outline"
            disabled={field.disabled}
            onClick={addFromDraft}
          >
            {context.fieldLabels?.add}
          </button>
        </div>
      </div>
    </FieldFrame>
  );
}
