import { Typography } from "@core-ts/react";
import type { FieldComponentProps } from "../registryTypes.js";
import type { Field, SectionField } from "../schema.js";
import { joinName } from "../dotPath.js";
import { FieldRenderer } from "../formBuilder.js";
import { SectionShell } from "./sectionShell.js";

export function Section(props: FieldComponentProps<SectionField>) {
  const { field, name, registry, context } = props;
  const body = (
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
  );

  return (
    <SectionShell
      label={
        field.label ? (
          <Typography variant="title" size="sm">
            {field.label}
          </Typography>
        ) : null
      }
      collapsible={field.collapsible}
      defaultOpen={field.defaultOpen ?? true}
    >
      {body}
    </SectionShell>
  );
}
