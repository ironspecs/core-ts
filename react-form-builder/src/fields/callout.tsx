import type { AriaRole } from "react";
import { cn, Typography } from "@core-ts/react";
import type { FieldComponentProps } from "../registryTypes.js";
import type { CalloutField } from "../schema.js";

type CalloutTone = CalloutField["tone"];

const toneClasses: Record<CalloutTone, string> = {
  info: "alert alert-info",
  success: "alert alert-success",
  warning: "alert alert-warning",
  error: "alert alert-error",
};

function resolveRole(tone: CalloutTone): AriaRole {
  if (tone === "error" || tone === "warning") {
    return "alert";
  }

  return "status";
}

export function Callout(props: FieldComponentProps<CalloutField>) {
  const { field } = props;

  return (
    <div
      className={cn(
        "min-h-12 items-start gap-3 shadow-none",
        toneClasses[field.tone],
      )}
      role={resolveRole(field.tone)}
    >
      <div className="min-w-0 flex-1">
        <Typography variant="body" className="block">
          {field.text}
        </Typography>
      </div>
    </div>
  );
}
