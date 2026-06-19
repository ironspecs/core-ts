import type { FieldComponentProps } from "../registryTypes.js";
import type { Field, InlineGroupField } from "../schema.js";
import { joinName } from "../dotPath.js";
import { FieldRenderer } from "../formBuilder.js";
import { Typography } from "@core-ts/react";

export function InlineGroup(props: FieldComponentProps<InlineGroupField>) {
  const { field, name, registry, context } = props;
  return (
    <div className="space-y-3">
      {field.label ? (
        <div>
          <Typography variant="body">{field.label}</Typography>
        </div>
      ) : null}

      <div className="space-y-4">
        {field.fields.map((child: Field, i: number) => {
          const childName = joinName(name, child.path);
          return (
            <FieldRenderer
              key={child.key ?? `${child.path}:${i}`}
              field={child}
              registry={registry}
              name={childName}
              context={context}
            />
          );
        })}
      </div>
    </div>
  );
}
