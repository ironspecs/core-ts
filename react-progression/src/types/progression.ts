/**
 * Owns the React step component contract for progression flows. Steps receive
 * readonly facts/context snapshots and can update durable context only through
 * explicit proceed/back change objects.
 */

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

export type ProceedChange<
  StepId extends string,
  TContext extends object = Record<string, unknown>,
> = Readonly<{
  runtimePatch?: Partial<TContext>;
  advance?: true | StepId;
}>;

export type BackChange<
  StepId extends string,
  TContext extends object = Record<string, unknown>,
> = Readonly<{
  runtimePatch?: Partial<TContext>;
  goBack?: true | StepId;
}>;

export type ProgressionStepProps<
  StepId extends string,
  TFacts extends Readonly<object> = Readonly<Record<string, unknown>>,
  TContext extends object = Record<string, unknown>,
> = Readonly<{
  facts: DeepReadonly<TFacts>;
  context: DeepReadonly<TContext>;
  onProceed: (change: ProceedChange<StepId, TContext>) => void;
  onBack?: (change: BackChange<StepId, TContext>) => void;
}>;

export type ProgressionStepComponent<
  StepId extends string,
  TFacts extends Readonly<object> = Readonly<Record<string, unknown>>,
  TContext extends object = Record<string, unknown>,
> = React.JSXElementConstructor<ProgressionStepProps<StepId, TFacts, TContext>>;
