import { useState } from "react";

import * as Popover from "@radix-ui/react-popover";
import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { ComboBoxField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";
import { Typography } from "@core-ts/react";

export function ComboBox(props: FieldComponentProps<ComboBoxField>) {
  const { field, name, context } = props;
  const { input } = useField<string>(name, { subscription: { value: true } });
  const v = typeof input.value === "string" ? input.value : "";
  const [q, setQ] = useState("");

  const options = field.options ?? [];
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(q.toLowerCase()),
  );
  const selectedLabel = options.find((o) => o.value === v)?.label ?? "";

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="btn btn-outline w-full justify-between"
            disabled={field.disabled}
          >
            <span className="truncate">
              {selectedLabel || field.placeholder}
            </span>
            <span className="opacity-70">▾</span>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content className="bg-base-100 border-base-300 rounded-box z-50 w-80 border-(length:--border) p-2 shadow">
            <input
              className="input input-bordered w-full"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={field.searchPlaceholder}
              disabled={field.disabled}
            />

            <div className="mt-2 max-h-60 space-y-1 overflow-auto">
              {filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className="btn btn-ghost w-full justify-start"
                  disabled={field.disabled}
                  onClick={() => input.onChange(o.value)}
                >
                  {o.label}
                </button>
              ))}
              {!filtered.length ? (
                <div className="px-2 py-2">
                  <Typography variant="body" muted>
                    {context.fieldLabels?.noResults}
                  </Typography>
                </div>
              ) : null}
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                className="btn"
                disabled={field.disabled}
                onClick={() => input.onChange("")}
              >
                {field.clearLabel}
              </button>
              <Popover.Close className="btn btn-primary" type="button">
                {field.doneLabel}
              </Popover.Close>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </FieldFrame>
  );
}
