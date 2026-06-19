/**
 * Owns generic workflow log entry derivation. Host apps provide business rules;
 * this helper validates that included entries have a concrete value or key.
 */

export type WorkflowLogEntry<
  LabelKey extends string = string,
  ValueKey extends string = string,
> = {
  labelKey: LabelKey;
  value: string | null;
  valueKey?: ValueKey;
};

export type WorkflowLogRule<
  RuntimeContext,
  LabelKey extends string = string,
  ValueKey extends string = string,
> = {
  labelKey: LabelKey;
  shouldInclude: (context: RuntimeContext) => boolean;
  resolveValue: (context: RuntimeContext) => string | null;
  valueKey?: ValueKey;
};

export function deriveWorkflowLogEntries<
  RuntimeContext,
  LabelKey extends string = string,
  ValueKey extends string = string,
>(params: {
  context: RuntimeContext;
  rules: ReadonlyArray<
    WorkflowLogRule<RuntimeContext, LabelKey, ValueKey>
  >;
}): WorkflowLogEntry<LabelKey, ValueKey>[] {
  const entries: WorkflowLogEntry<LabelKey, ValueKey>[] = [];
  for (const rule of params.rules) {
    if (!rule.shouldInclude(params.context)) continue;
    const value = rule.resolveValue(params.context);
    if (!rule.valueKey && !value) {
      throw new Error(
        `Workflow setup log "${rule.labelKey}" requires a value or valueKey`,
      );
    }
    entries.push({
      labelKey: rule.labelKey,
      value,
      valueKey: rule.valueKey,
    });
  }
  return entries;
}
