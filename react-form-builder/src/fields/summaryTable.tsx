import { useFormState } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { SummaryTableField } from "../schema.js";
import { joinName } from "../dotPath.js";
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

function fmt(v: unknown) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return "";
  }
}

export function SummaryTable(props: FieldComponentProps<SummaryTableField>) {
  const { field, name } = props;
  const { values } = useFormState({ subscription: { values: true } });

  return (
    <div className="border-base-300 rounded-box overflow-x-auto border-(length:--border)">
      <table className="table-sm table">
        <tbody>
          {field.rows.map((r) => {
            const rowName = joinName(name, r.path);
            const v = getIn(values, rowName);
            return (
              <tr key={r.path}>
                <th className="w-56">
                  <Typography variant="body">{r.label}</Typography>
                </th>
                <td>
                  <Typography variant="mono" size="sm">
                    {fmt(v)}
                  </Typography>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
