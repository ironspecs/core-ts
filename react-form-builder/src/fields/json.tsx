import { useState } from "react";

import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { JsonField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";

function pretty(v: unknown) {
  if (v === undefined) return "";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}

export function JsonEditor(props: FieldComponentProps<JsonField>) {
  const { field, name } = props;
  const { input, meta } = useField<unknown>(name, {
    subscription: {
      value: true,
      touched: true,
      submitError: true,
      error: true,
    },
  });

  const [editorState, setEditorState] = useState(() => ({
    submitError: meta.submitError,
    text: pretty(input.value),
    err: null as string | null,
  }));
  if (editorState.submitError !== meta.submitError) {
    setEditorState({
      submitError: meta.submitError,
      text: pretty(input.value),
      err: null,
    });
  }
  const text = editorState.text;
  const err = editorState.err;

  function apply() {
    try {
      const t = text.trim();
      const parsed = t === "" ? null : JSON.parse(t);
      input.onChange(parsed);
      setEditorState((current) => ({ ...current, err: null }));
    } catch {
      setEditorState((current) => ({
        ...current,
        err: field.invalidJsonLabel,
      }));
    }
  }

  const serverErr = meta.touched ? (meta.submitError ?? meta.error) : null;

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
      error={serverErr ?? err ?? undefined}
    >
      <div className="space-y-2">
        <textarea
          className="textarea textarea-bordered min-h-40 w-full font-mono text-xs"
          disabled={field.disabled}
          value={text}
          onChange={(e) =>
            setEditorState((current) => ({
              ...current,
              text: e.target.value,
            }))
          }
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-primary"
            disabled={field.disabled}
            onClick={apply}
          >
            {field.applyLabel}
          </button>
        </div>
      </div>
    </FieldFrame>
  );
}
