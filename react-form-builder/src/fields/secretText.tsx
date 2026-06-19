import { useState } from "react";

import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { SecretTextField } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";

export function SecretText(props: FieldComponentProps<SecretTextField>) {
  const { field, name } = props;
  const { input } = useField<string>(name, { subscription: { value: true } });
  const [show, setShow] = useState(false);

  const v = typeof input.value === "string" ? input.value : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(v);
    } catch {
      // ignore
    }
  }

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className="join w-full">
        <input
          className="input input-bordered join-item w-full"
          type={show ? "text" : "password"}
          disabled={field.disabled}
          value={v}
          placeholder={field.placeholder}
          onChange={(e) => input.onChange(e.target.value)}
        />
        <button
          type="button"
          className="btn join-item"
          disabled={field.disabled}
          onClick={() => setShow((s) => !s)}
        >
          {show ? field.hideLabel : field.showLabel}
        </button>
        {field.allowCopy ? (
          <button
            type="button"
            className="btn join-item"
            disabled={field.disabled || !v}
            onClick={copy}
          >
            {field.copyLabel}
          </button>
        ) : null}
      </div>
    </FieldFrame>
  );
}
