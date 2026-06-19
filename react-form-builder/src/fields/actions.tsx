import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { ActionsField } from "../schema.js";

function toneClass(t?: string) {
  if (t === "primary") return "btn btn-primary";
  if (t === "outline") return "btn btn-outline";
  if (t === "danger") return "btn btn-error";
  return "btn";
}

export function Actions(props: FieldComponentProps<ActionsField>) {
  const { field, name, context } = props;
  // Subscribe to current field value so onAction gets the right value.
  const { input: _ } = useField<unknown>(name, {
    subscription: { value: true },
  });

  const disabled = field.disabled || !context?.onAction;

  return (
    <div className="flex flex-wrap gap-2">
      {field.actions.map((a) => (
        <button
          key={a.id}
          type="button"
          className={toneClass(a.tone)}
          disabled={disabled}
          onClick={() => {
            if (!context?.onAction) return;
            context.onAction({
              id: a.id,
              path: name,
            });
          }}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
