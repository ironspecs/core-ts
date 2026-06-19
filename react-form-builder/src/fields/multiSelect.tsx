import * as Popover from "@radix-ui/react-popover";
import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { MultiSelectField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";
import { Typography } from "@core-ts/react";

function normalize(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string") as string[];
}

export function MultiSelect(props: FieldComponentProps<MultiSelectField>) {
  const { field, name, context } = props;
  const { input } = useField<unknown>(name, { subscription: { value: true } });
  const selected = normalize(input.value);

  function toggle(val: string) {
    if (selected.includes(val))
      input.onChange(selected.filter((x) => x !== val));
    else input.onChange([...selected, val]);
  }

  const labelFor = (v: string) =>
    field.options.find((o) => o.value === v)?.label ?? v;

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {selected.length ? (
            selected.map((v) => (
              <span key={v} className="badge badge-outline gap-2">
                {labelFor(v)}
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={field.disabled}
                  onClick={() => toggle(v)}
                >
                  ✕
                </button>
              </span>
            ))
          ) : (
            <div>
              <Typography variant="body" muted>
                {context.fieldLabels?.noSelection}
              </Typography>
            </div>
          )}
        </div>

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="btn btn-outline w-full justify-between"
              disabled={field.disabled}
            >
              <span className="truncate">{field.placeholder}</span>
              <span className="opacity-70">▾</span>
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content className="bg-base-100 border-base-300 rounded-box z-50 w-80 border-(length:--border) p-2 shadow">
              <div className="max-h-64 space-y-1 overflow-auto">
                {field.options.map((opt) => {
                  const checked = selected.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className="hover:bg-base-200 rounded-field flex cursor-pointer items-center gap-3 px-2 py-2"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        disabled={field.disabled}
                        checked={checked}
                        onChange={() => toggle(opt.value)}
                      />
                      <Typography variant="body">{opt.label}</Typography>
                    </label>
                  );
                })}
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn"
                  disabled={field.disabled}
                  onClick={() => input.onChange([])}
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
      </div>
    </FieldFrame>
  );
}
