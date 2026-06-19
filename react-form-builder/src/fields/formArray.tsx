import { FieldArray } from "react-final-form-arrays";
import type { FieldComponentProps } from "../registryTypes.js";
import type { Field, FormArrayField } from "../schema.js";
import { FieldRenderer } from "../formBuilder.js";
import { joinName } from "../dotPath.js";
import { Typography } from "@core-ts/react";
import { SectionShell } from "./sectionShell.js";

function itemKey(item: unknown, index: number, keyPath?: string) {
  if (keyPath && item && typeof item === "object" && !Array.isArray(item)) {
    const k = (item as Record<string, unknown>)[keyPath];
    if (typeof k === "string" || typeof k === "number") return String(k);
  }
  return String(index);
}

export function FormArray(props: FieldComponentProps<FormArrayField>) {
  const { field, name, registry, context } = props;
  const body = (
    <FieldArray name={name}>
      {({ fields }) => (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-outline"
              disabled={field.disabled}
              onClick={() => fields.push({})}
            >
              {context.fieldLabels?.add}
            </button>
          </div>

          {fields.length === 0 ? (
            <div>
              <Typography variant="body" muted>
                {context.fieldLabels?.noEntries}
              </Typography>
            </div>
          ) : null}

          {fields.map((_, index) => {
            const itemName = joinName(name, String(index));
            const value = fields.value?.[index];
            const key = itemKey(
              value,
              index,
              (field as FormArrayField & { itemKey?: string }).itemKey,
            );

            return (
              <div
                key={key}
                className="card bg-base-100 border-base-300 border-(length:--border)"
              >
                <div className="card-body space-y-4">
                  <div className="flex items-center justify-between">
                    <Typography variant="body">
                      {`${field.itemLabel} ${index + 1}`}
                    </Typography>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={field.disabled}
                      onClick={() => fields.remove(index)}
                    >
                      {field.removeLabel}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {field.fields.map((child: Field, i: number) => {
                      const childName = joinName(itemName, child.path);
                      return (
                        <FieldRenderer
                          key={child.key ?? `${index}:${child.path}:${i}`}
                          field={child}
                          registry={registry}
                          name={childName}
                          context={context}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </FieldArray>
  );

  return (
    <SectionShell
      label={
        field.label ? (
          <Typography variant="title" size="sm">
            {field.label}
          </Typography>
        ) : null
      }
      collapsible={field.collapsible}
      defaultOpen={field.defaultOpen ?? true}
    >
      {body}
    </SectionShell>
  );
}
