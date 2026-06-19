import { useFormState } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { StatusChecklistField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";
import { getIn, joinName } from "../dotPath.js";
import { Typography } from "@core-ts/react";

const ICON_SLOT_CLASS = "w-6 flex-none flex items-start justify-center pt-1";

function statusKey(field: StatusChecklistField, v: unknown): string {
  if (typeof v === "string" && v.length > 0) return v;
  return field.unknownKey;
}

export function StatusChecklist(
  props: FieldComponentProps<StatusChecklistField>,
) {
  const { field, name } = props;
  const { values } = useFormState<Record<string, unknown>>({
    subscription: { values: true },
  });

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className="space-y-3">
        {field.items.map((item, i) => {
          const fullPath = joinName(name, item.path);
          const v = getIn(values, fullPath);
          const key = statusKey(field, v);

          const icon = field.icons[key] ?? field.defaultIcon;

          return (
            <div key={`${item.path}:${i}`} className="flex gap-3">
              <span className={ICON_SLOT_CLASS}>{icon}</span>

              <div className="min-w-0 flex-1">
                <div>
                  <Typography variant="body">{item.label}</Typography>
                </div>

                {item.description ? (
                  <div>
                    <Typography variant="hint">{item.description}</Typography>
                  </div>
                ) : null}

                {/* optional debug line; keep off by default */}
                {/* <div className="text-xs opacity-50">{String(v)}</div> */}
              </div>
            </div>
          );
        })}
      </div>
    </FieldFrame>
  );
}
