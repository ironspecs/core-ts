import * as Tabs from "@radix-ui/react-tabs";
import { Typography } from "@core-ts/react";
import type { FieldComponentProps } from "../registryTypes.js";
import type { Field, TabsField } from "../schema.js";
import { FieldRenderer } from "../formBuilder.js";
import { joinName } from "../dotPath.js";
import { SectionShell } from "./sectionShell.js";

export function TabsFieldComp(props: FieldComponentProps<TabsField>) {
  const { field, name, registry, context } = props;
  const tabs = field.tabs ?? [];
  const defaultTab =
    field.defaultTab && tabs.some((t) => t.value === field.defaultTab)
      ? field.defaultTab
      : (tabs[0]?.value ?? "");
  const body = (
    <Tabs.Root defaultValue={defaultTab}>
      <Tabs.List className="tabs tabs-bordered">
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.value}
            value={t.value}
            className="tab data-[state=active]:tab-active"
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {tabs.map((t) => (
        <Tabs.Content key={t.value} value={t.value} className="pt-4">
          <div className="space-y-4">
            {t.fields.map((child: Field, i: number) => {
              const childName = joinName(name, child.path);
              return (
                <FieldRenderer
                  key={child.key ?? `${t.value}:${child.path}:${i}`}
                  field={child}
                  registry={registry}
                  name={childName}
                  context={context}
                />
              );
            })}
          </div>
        </Tabs.Content>
      ))}
    </Tabs.Root>
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
