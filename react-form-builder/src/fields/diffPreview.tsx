import { useFormState } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { DiffPreviewField } from "../schema.js";
import { Typography } from "@core-ts/react";

function getIn(obj: unknown, name: string): unknown {
  if (!name) return obj;
  const parts = name.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    const isIndex = /^\d+$/.test(p);
    cur = isIndex
      ? (cur as unknown[])[Number(p)]
      : (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function pretty(v: unknown) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}

function isSame(a: unknown, b: unknown) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function DiffPreview(props: FieldComponentProps<DiffPreviewField>) {
  const { name, context } = props;
  const { values, initialValues } = useFormState({
    subscription: { values: true, initialValues: true },
  });

  const a = getIn(initialValues, name);
  const b = getIn(values, name);

  if (isSame(a, b))
    return (
      <div>
        <Typography variant="body" muted>
          {context.fieldLabels?.noChanges}
        </Typography>
      </div>
    );

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="border-base-300 rounded-box border-(length:--border) p-2">
        <div className="mb-2">
          <Typography variant="body">
            {context.fieldLabels?.original}
          </Typography>
        </div>
        <pre className="overflow-auto">
          <Typography variant="mono" size="sm">
            {pretty(a)}
          </Typography>
        </pre>
      </div>
      <div className="border-base-300 rounded-box border-(length:--border) p-2">
        <div className="mb-2">
          <Typography variant="body">{context.fieldLabels?.draft}</Typography>
        </div>
        <pre className="overflow-auto">
          <Typography variant="mono" size="sm">
            {pretty(b)}
          </Typography>
        </pre>
      </div>
    </div>
  );
}
