import * as Select from "@radix-ui/react-select";
import { useField, useForm } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { DiscriminatingFormField, Field } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";
import { joinName } from "../dotPath.js";
import { FieldRenderer } from "../formBuilder.js";
import { Typography } from "@core-ts/react";
import { SectionShell } from "./sectionShell.js";

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

export function DiscriminatingForm(
  props: FieldComponentProps<DiscriminatingFormField>,
) {
  const { field, name, registry, context } = props;
  const variants = field.variants ?? [];
  assert(
    variants.length > 0,
    "discriminatingForm requires at least one variant.",
  );
  const nullVariant = variants.find((v) => v.fields === null);
  assert(
    !!nullVariant,
    "discriminatingForm requires one variant with fields: null.",
  );

  const form = useForm();
  const { input } = useField<unknown>(name, {
    subscription: { value: true },
    allowNull: true,
    format: (v) => v,
  });
  const currentValue = input.value;

  // Toggle mode: discriminatorKey omitted => null vs object
  if (!field.discriminatorKey) {
    assert(
      variants.length <= 2,
      "discriminatingForm without discriminatorKey supports at most two variants.",
    );
    const nonNullVariant = variants.find((v) => v.fields !== null);
    assert(
      !!nonNullVariant && nonNullVariant.fields !== null,
      "discriminatingForm without discriminatorKey requires one variant with fields: Field[].",
    );

    const current = currentValue == null ? nullVariant : nonNullVariant;
    function setVariant(next: string) {
      if (next === nullVariant?.value) form.change(name, null);
      if (next === nonNullVariant?.value)
        form.change(name, isRecord(currentValue) ? currentValue : {});
    }

    return (
      <SectionShell
        label={
          field.label ? (
            <Typography variant="title" size="sm">
              {field.label}
            </Typography>
          ) : null
        }
        collapsible={!!field.collapsible}
        defaultOpen={field.defaultOpen ?? true}
      >
        <FieldFrame
          label={field.discriminatorLabel}
          required={field.required}
          description={field.description}
        >
          <Select.Root
            value={current.value}
            onValueChange={setVariant}
            disabled={field.disabled}
          >
            <Select.Trigger className="select select-bordered flex w-full items-center justify-between">
              <Select.Value placeholder={field.placeholder} />
              <Select.Icon className="opacity-70">▾</Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content className="bg-base-100 border-base-300 rounded-box z-50 overflow-hidden border-(length:--border) shadow">
                <Select.Viewport className="p-1">
                  {variants.map((opt) => (
                    <Select.Item
                      key={opt.value}
                      value={opt.value}
                      className="data-[highlighted]:bg-base-200 rounded-field cursor-pointer px-3 py-2 outline-none"
                    >
                      <Select.ItemText>{opt.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </FieldFrame>

        {current.fields === null ? null : (
          <div className="space-y-4">
            {current.fields.map((child: Field, i: number) => {
              const childName = joinName(name, child.path);
              return (
                <FieldRenderer
                  key={child.key ?? `${child.path}:${i}`}
                  field={child}
                  registry={registry}
                  name={childName}
                  context={context}
                />
              );
            })}
          </div>
        )}
      </SectionShell>
    );
  }

  // Discriminated mode: discriminatorKey present inside object at `name`
  const key = field.discriminatorKey;

  const discriminatorValue = (() => {
    if (!isRecord(currentValue)) return nullVariant.value;
    const raw = currentValue[key];
    if (typeof raw !== "string") return nullVariant.value;
    return variants.some((v) => v.value === raw) ? raw : nullVariant.value;
  })();

  const current =
    variants.find((v) => v.value === discriminatorValue) ?? nullVariant;

  function setVariant(nextVal: string) {
    const next = variants.find((v) => v.value === nextVal);
    assert(!!next, "discriminatingForm setVariant: unknown variant value.");
    if (next.fields === null) return form.change(name, null);
    form.change(name, { [key]: next.value });
  }

  return (
    <SectionShell
      label={
        field.label ? (
          <Typography variant="title" size="sm">
            {field.label}
          </Typography>
        ) : null
      }
      collapsible={!!field.collapsible}
      defaultOpen={field.defaultOpen ?? true}
    >
      <FieldFrame
        label={field.discriminatorLabel}
        required={field.required}
        description={field.description}
      >
        <Select.Root
          value={current.value}
          onValueChange={setVariant}
          disabled={field.disabled}
        >
          <Select.Trigger className="select select-bordered flex w-full items-center justify-between">
            <Select.Value placeholder={field.placeholder} />
            <Select.Icon className="opacity-70">▾</Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content className="bg-base-100 border-base-300 rounded-box z-50 overflow-hidden border-(length:--border) shadow">
              <Select.Viewport className="p-1">
                {variants.map((opt) => (
                  <Select.Item
                    key={opt.value}
                    value={opt.value}
                    className="data-[highlighted]:bg-base-200 rounded-field cursor-pointer px-3 py-2 outline-none"
                  >
                    <Select.ItemText>{opt.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </FieldFrame>

      {current.fields === null ? null : (
        <div className="space-y-4">
          {current.fields.map((child: Field, i: number) => {
            const childName = joinName(name, child.path);
            return (
              <FieldRenderer
                key={child.key ?? `${child.path}:${i}`}
                field={child}
                registry={registry}
                name={childName}
                context={context}
              />
            );
          })}
        </div>
      )}
    </SectionShell>
  );
}
