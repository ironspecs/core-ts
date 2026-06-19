import { useField } from "react-final-form";
import type { FieldComponentProps } from "../registryTypes.js";
import type { ImageUrlField, ImageActionSpec } from "../schema.js";
import { FieldFrame } from "../ui/fieldFrame.js";
import { Typography } from "@core-ts/react";

function toneClass(t?: ImageActionSpec["tone"]) {
  if (t === "primary") return "btn btn-primary";
  if (t === "outline") return "btn btn-outline";
  if (t === "danger") return "btn btn-error";
  return "btn";
}

function asUrl(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function aspectClass(a?: ImageUrlField["aspect"]) {
  if (a === "square") return "aspect-square";
  if (a === "portrait") return "aspect-[3/4]";
  if (a === "landscape") return "aspect-[16/9]";
  return ""; // auto
}

function fitClass(f?: ImageUrlField["fit"]) {
  return f === "contain" ? "object-contain" : "object-cover";
}

export function ImageUrl(props: FieldComponentProps<ImageUrlField>) {
  const { field, name, context } = props;
  const { input } = useField<unknown>(name, { subscription: { value: true } });
  const url = asUrl(input.value);

  const canAction = !!context?.onAction && !field.disabled;
  const actions = field.actions ?? [];

  function runAction(a: ImageActionSpec) {
    if (!context?.onAction) return;
    context.onAction({
      id: a.id,
      path: name,
    });
  }

  function clear() {
    input.onChange(null);
  }

  const maxH = field.maxHeight
    ? { maxHeight: `${field.maxHeight}px` }
    : undefined;

  return (
    <FieldFrame
      label={field.label}
      required={field.required}
      description={field.description}
    >
      <div className="space-y-2">
        <div
          className={[
            "bg-base-200 border-base-300 rounded-box w-full overflow-hidden border-(length:--border)",
            aspectClass(field.aspect),
          ].join(" ")}
          style={maxH}
        >
          {url ? (
            <img
              src={url}
              alt={field.alt}
              className={["h-full w-full", fitClass(field.fit)].join(" ")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-6">
              <Typography variant="body" muted>
                {context.fieldLabels?.noImage}
              </Typography>
            </div>
          )}
        </div>

        {field.showUrl && url ? (
          <div className="truncate">
            <Typography variant="hint">{url}</Typography>
          </div>
        ) : null}

        {actions.length > 0 || field.allowClear ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <button
                key={a.id}
                type="button"
                className={toneClass(a.tone)}
                disabled={!canAction}
                onClick={() => runAction(a)}
              >
                {a.label}
              </button>
            ))}

            {field.allowClear ? (
              <button
                type="button"
                className="btn btn-outline"
                disabled={field.disabled || !url}
                onClick={clear}
              >
                {field.clearLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </FieldFrame>
  );
}
