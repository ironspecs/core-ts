import { useRef, useState } from "react";

import { useField } from "react-final-form";
import { FieldFrame } from "../ui/fieldFrame.js";
import { FileUploadField } from "../schema.js";
import { FieldComponentProps } from "../registryTypes.js";
import { Typography } from "@core-ts/react";

function kindOf(v: unknown) {
  if (v instanceof File) return "file";
  if (typeof v === "string" && v.length > 0) return "url";
  return "null";
}

export function FileUpload(props: FieldComponentProps<FileUploadField>) {
  const { field, name } = props;
  const { input } = useField(name, { subscription: { value: true } });

  const kind = kindOf(input.value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [key, setKey] = useState(0);
  const inputKey = `${kind}:${kind === "file" ? String(key) : String(input.value)}`;

  function clear() {
    input.onChange(null);
    if (inputRef.current) inputRef.current.value = "";
    setKey((k) => k + 1);
  }

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className="space-y-2">
        {kind === "url" && (
          <div className="truncate">
            <Typography variant="hint">
              {field.currentLabel}: {input.value}
            </Typography>
          </div>
        )}

        {kind === "file" && (
          <div>
            <Typography variant="hint">
              {field.selectedLabel}: {(input.value as File).name}
            </Typography>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            key={inputKey}
            ref={inputRef}
            className="file-input file-input-bordered w-full"
            type="file"
            disabled={field.disabled}
            onChange={(e) => input.onChange(e.target.files?.[0] ?? null)}
          />

          <button
            type="button"
            className="btn btn-outline"
            disabled={field.disabled || kind === "null"}
            onClick={clear}
          >
            {field.clearLabel}
          </button>
        </div>
      </div>
    </FieldFrame>
  );
}
