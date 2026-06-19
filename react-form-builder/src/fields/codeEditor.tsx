import { useState } from "react";

import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { CodeEditorField } from "../schema.js";
import { FieldFrame } from "../fieldFrame.js";

function toText(field: CodeEditorField, v: unknown) {
  if (typeof v === "string") return v;

  if (field.language === "json") {
    try {
      if (v === undefined) return "";
      return JSON.stringify(v, null, 2);
    } catch {
      return "";
    }
  }

  return "";
}

export function CodeEditor(props: FieldComponentProps<CodeEditorField>) {
  const { field, name } = props;
  const { input } = useField<unknown>(name, { subscription: { value: true } });

  const [editorState, setEditorState] = useState(() => ({
    language: field.language,
    sourceValue: input.value,
    text: toText(field, input.value),
    err: null as string | null,
  }));
  if (
    editorState.language !== field.language ||
    editorState.sourceValue !== input.value
  ) {
    setEditorState({
      language: field.language,
      sourceValue: input.value,
      text: toText(field, input.value),
      err: null,
    });
  }
  const text = editorState.text;
  const err = editorState.err;

  function format() {
    if (field.language !== "json") return;

    try {
      const parsed = text.trim() === "" ? null : JSON.parse(text);
      setEditorState((current) => ({
        ...current,
        text: JSON.stringify(parsed, null, 2),
        err: null,
      }));
    } catch {
      setEditorState((current) => ({
        ...current,
        err: field.invalidJsonLabel,
      }));
    }
  }

  function apply() {
    if (field.language === "json") {
      try {
        const parsed = text.trim() === "" ? null : JSON.parse(text);
        input.onChange(parsed);
        setEditorState((current) => ({ ...current, err: null }));
      } catch {
        setEditorState((current) => ({
          ...current,
          err: field.invalidJsonLabel,
        }));
      }
      return;
    }

    input.onChange(text);
    setEditorState((current) => ({ ...current, err: null }));
  }

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
      error={err ?? undefined}
    >
      <div className="space-y-2">
        <textarea
          className="textarea textarea-bordered min-h-40 w-full font-mono text-xs"
          placeholder={field.placeholder}
          disabled={field.disabled}
          value={text}
          onChange={(e) =>
            setEditorState((current) => ({
              ...current,
              text: e.target.value,
            }))
          }
          onBlur={input.onBlur}
          onFocus={input.onFocus}
        />
        <div className="flex gap-2">
          {field.allowFormat && field.language === "json" ? (
            <button
              type="button"
              className="btn"
              disabled={field.disabled}
              onClick={format}
            >
              {field.formatLabel}
            </button>
          ) : null}
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
