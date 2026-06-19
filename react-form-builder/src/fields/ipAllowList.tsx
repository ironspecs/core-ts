import { useState } from "react";

import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { IpAllowListField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";
import { Typography } from "@core-ts/react";

function normalize(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string" && x.trim() !== "") as string[];
}

function looksLikeIp(s: string) {
  const t = s.trim();
  if (!t) return false;
  if (t.includes("/")) return true; // CIDR-ish
  if (t.includes(":")) return true; // IPv6-ish
  const parts = t.split(".");
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p));
}

export function IpAllowList(props: FieldComponentProps<IpAllowListField>) {
  const { field, name, context } = props;
  const { input } = useField<unknown>(name, { subscription: { value: true } });
  const items = normalize(input.value);

  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function add() {
    const t = draft.trim();
    if (!t) return;
    if (!looksLikeIp(t)) {
      setErr(field.invalidIpLabel);
      return;
    }
    if (items.includes(t)) {
      setDraft("");
      setErr(null);
      return;
    }
    input.onChange([...items, t]);
    setDraft("");
    setErr(null);
  }

  function remove(x: string) {
    input.onChange(items.filter((i) => i !== x));
  }

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
      error={err ?? undefined}
    >
      <div className="space-y-2">
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
