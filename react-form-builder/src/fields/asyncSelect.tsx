import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Popover from "@radix-ui/react-popover";
import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { AsyncSelectField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";
import { Typography } from "@core-ts/react";

type Opt = { label: string; value: string };

export function AsyncSelect(props: FieldComponentProps<AsyncSelectField>) {
  const { field, name, context } = props;
  const { input, meta: _ } = useField<unknown>(name, {
    subscription: {
      value: true,
      touched: true,
      error: true,
      submitError: true,
    },
  });

  const v = typeof input.value === "string" ? input.value : "";

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const optionsQuery = useQuery({
    queryKey: ["async-select-options", field.sourceId, open ? q : "", v],
    enabled: Boolean(context?.loadOptions) && (open || Boolean(v)),
    queryFn: async (): Promise<Opt[]> => {
      if (!context?.loadOptions) {
        return [];
      }
      return context.loadOptions({
        sourceId: field.sourceId,
        query: open ? q : "",
      });
    },
    retry: false,
  });
  const opts = optionsQuery.data ?? [];
  const loading = optionsQuery.isPending;
  const selectedLabel = opts.find((o) => o.value === v)?.label ?? "";

  function choose(val: string) {
    input.onChange(val);
    setOpen(false);
  }

  function clear() {
    // Per your rule: null means delete.
    input.onChange(null);
    setOpen(false);
  }

  const disabled = field.disabled || !context?.loadOptions;

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
      // If you want errors here too, wire pickError(meta) like other fields.
    >
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="btn btn-outline w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">
              {selectedLabel || field.placeholder}
            </span>
            <span className="opacity-70">▾</span>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content className="bg-base-100 border-base-300 rounded-box z-50 w-80 border-(length:--border) p-2 shadow">
            <div className="flex gap-2">
              <input
                className="input input-bordered w-full"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={field.searchPlaceholder}
                disabled={field.disabled}
              />
              <button
                type="button"
                className="btn"
                disabled={field.disabled}
                onClick={() => {
                  optionsQuery.refetch().catch(console.error);
                }}
              >
                {field.goLabel}
              </button>
            </div>

            <div className="mt-2 max-h-60 space-y-1 overflow-auto">
              {loading ? (
                <div className="px-2 py-2">
                  <Typography variant="body" muted>
                    {context.fieldLabels?.loading}
                  </Typography>
                </div>
              ) : null}

              {!loading &&
                opts.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className="btn btn-ghost w-full justify-start"
                    disabled={field.disabled}
                    onClick={() => choose(o.value)}
                  >
                    {o.label}
                  </button>
                ))}

              {!loading && !opts.length ? (
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
                onClick={clear}
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
