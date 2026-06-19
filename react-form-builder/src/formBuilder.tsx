import { useRef, type ComponentProps } from "react";
import { Form, useForm } from "react-final-form";
import arrayMutators from "final-form-arrays";
import type { Field, FormSchema } from "./schema.js";
import type { FormContext, Registry } from "./registryTypes.js";
import { getIn, setIn, type DotPath, joinName } from "./dotPath.js";
import { useMountEffect } from "@core-ts/react";
import { cn } from "@core-ts/react";

export type FinalFormModified = Record<DotPath, boolean | undefined>;

/**
 * A JSON Merge Patch document can be any JSON value. In your usage, this will
 * typically be an object.
 */
export type MergePatch = Record<string, unknown>;

export type FormBuilderValuesChangeMeta = {
  dirty: boolean;
  pristine: boolean;
  submitting: boolean;
  valid: boolean;
  modified: FinalFormModified;
  getSparseChanges: () => MergePatch;
};

/**
 * Build a sparse JSON Merge Patch payload using ONLY Final Form's `modified`
 * map.
 *
 * Rules:
 *
 * - If modified[path] is true, include that path with the current value.
 * - If modified[path] is false/undefined, do not include it.
 * - If current value is null, patch includes null (server interprets deletion).
 *
 * No schema input. No parent/child collapsing. No array heuristics.
 */
export function buildSparseMergePatchFromFinalForm(args: {
  values: Record<string, unknown>;
  modified: FinalFormModified;
}): MergePatch {
  const { values, modified } = args;

  let patch: MergePatch = {};

  for (const path of Object.keys(modified)) {
    if (!modified[path]) continue;

    const v = getIn(values, path);
    patch = setIn(patch, path, v);
  }

  return patch;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a record`);
  }
  return value as Record<string, unknown>;
}

function requireFinalFormModified(value: unknown): FinalFormModified {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Form modified state must be a record");
  }
  return value as FinalFormModified;
}

function createSparseChangesGetter(args: {
  values: Record<string, unknown>;
  modified: FinalFormModified;
}): () => MergePatch {
  let cache: MergePatch | undefined;
  let hasCached = false;

  return () => {
    if (hasCached) {
      return cache as MergePatch;
    }

    cache = buildSparseMergePatchFromFinalForm(args);
    hasCached = true;
    return cache;
  };
}

type ValuesChangeObserverProps = {
  onValuesChange?: (
    values: Record<string, unknown>,
    meta: FormBuilderValuesChangeMeta,
  ) => void;
};
function ValuesChangeObserver(props: ValuesChangeObserverProps) {
  const { onValuesChange } = props;
  const form = useForm();

  const isFirstRenderRef = useRef(true);
  const onValuesChangeRef = useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;

  useMountEffect(() => {
    return form.subscribe(
      (nextState) => {
        if (!onValuesChangeRef.current) return;

        if (isFirstRenderRef.current) {
          isFirstRenderRef.current = false;
          return;
        }

        const formState = form.getState();
        const values = requireRecord(nextState.values, "Form values");
        const modified = requireFinalFormModified(nextState.modified ?? {});

        onValuesChangeRef.current(values, {
          dirty: Boolean(formState.dirty),
          pristine: Boolean(formState.pristine),
          submitting: Boolean(formState.submitting),
          valid: Boolean(formState.valid),
          modified,
          getSparseChanges: createSparseChangesGetter({ values, modified }),
        });
      },
      {
        values: true,
        modified: true,
      },
    );
  });

  return null;
}

type FieldRendererProps = {
  field: Field;
  registry: Registry;
  name: string;
  context: FormContext;
};
export function FieldRenderer(props: FieldRendererProps) {
  const { field, registry, name, context } = props;

  const Comp = registry[field.type];
  if (!Comp) throw new Error(`Unsupported field type: ${field.type}`);

  return (
    <Comp field={field} name={name} registry={registry} context={context} />
  );
}

function fieldKey(f: Field, fallback: string) {
  return f.key ?? f.path ?? fallback;
}

function fieldName(f: Field): string {
  // name override or path.
  return f.name && f.name.length > 0 ? f.name : f.path;
}

export type FormBuilderProps = {
  schema: FormSchema;
  data: Record<string, unknown>;
  registry: Registry;
  context: FormContext;
  showDefaultActions?: boolean;
  labels: {
    submitButton: string;
    resetButton: string;
  };
  actionProps?: {
    submitButton?: ComponentProps<"button">;
    resetButton?: ComponentProps<"button">;
  };
  onValuesChange?: (
    values: Record<string, unknown>,
    meta: FormBuilderValuesChangeMeta,
  ) => void;
  onSubmit: (
    changes: Record<string, unknown>,
    fullValues: Record<string, unknown>,
  ) => Promise<Record<string, unknown> | void> | Record<string, unknown> | void;
};
export function FormBuilder(props: FormBuilderProps) {
  const {
    schema,
    data,
    registry,
    context,
    showDefaultActions = true,
    onSubmit,
    onValuesChange,
    labels,
    actionProps,
  } = props;

  return (
    <Form
      initialValues={data}
      mutators={{ ...arrayMutators }}
      onSubmit={async (values, form) => {
        const state = form.getState();
        const patch = buildSparseMergePatchFromFinalForm({
          values: (state.values ?? {}) as Record<string, unknown>,
          modified: (state.modified ?? {}) as FinalFormModified,
        });

        return onSubmit(patch, values as Record<string, unknown>);
      }}
      render={({ handleSubmit, submitting, pristine, form }) => {
        const submitButtonProps = actionProps?.submitButton;
        const resetButtonProps = actionProps?.resetButton;
        const { className: submitButtonClassName, ...submitButtonRest } =
          submitButtonProps ?? {};
        const {
          className: resetButtonClassName,
          onClick: onResetClick,
          ...resetButtonRest
        } = resetButtonProps ?? {};
        const handleResetClick: ComponentProps<"button">["onClick"] = (
          event,
        ) => {
          onResetClick?.(event);
          if (event.defaultPrevented) {
            return;
          }
          form.reset();
        };

        return (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <ValuesChangeObserver onValuesChange={onValuesChange} />
            {schema.map((field, i) => {
              const relName = fieldName(field);
              const name = joinName("", relName);

              return (
                <FieldRenderer
                  key={fieldKey(field, `root:${i}`)}
                  field={field}
                  registry={registry}
                  name={name}
                  context={context}
                />
              );
            })}

            {showDefaultActions ? (
              <div className="flex gap-2">
                <button
                  {...submitButtonRest}
                  className={cn("btn btn-primary", submitButtonClassName)}
                  type="submit"
                  disabled={
                    Boolean(submitButtonProps?.disabled) ||
                    submitting ||
                    pristine
                  }
                >
                  {labels.submitButton}
                </button>
                <button
                  {...resetButtonRest}
                  className={cn("btn btn-ghost", resetButtonClassName)}
                  type="button"
                  disabled={
                    Boolean(resetButtonProps?.disabled) ||
                    submitting ||
                    pristine
                  }
                  onClick={handleResetClick}
                >
                  {labels.resetButton}
                </button>
              </div>
            ) : null}
          </form>
        );
      }}
    />
  );
}
