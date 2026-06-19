/**
 * Owns the React render shell for fixed-step progression flows. This component
 * keeps facts immutable, stores workflow context as the durable runtime state,
 * and only accepts context changes through explicit proceed/back patches.
 */

import React, { useMemo, useState } from 'react';
import { cn } from '@core-ts/react';
import type {
  BackChange,
  DeepReadonly,
  ProceedChange,
  ProgressionStepProps,
  ProgressionStepComponent,
} from '../types/progression.js';

type ProgressionStepErrorBoundaryProps = Readonly<{
  children: React.ReactNode;
  fallback: React.ReactNode;
  resetKey: string;
}>;

type ProgressionStepErrorBoundaryState = Readonly<{
  hasError: boolean;
}>;

type ProgressionState<
  StepId extends string,
  TContext extends object = Record<string, unknown>,
> = {
  step: StepId;
  progress: number;
  context: TContext;
  result: 'completed' | 'cancelled' | null;
};

const patchContext = <
  StepId extends string,
  TContext extends object = Record<string, unknown>,
>(
  current: ProgressionState<StepId, TContext>,
  patch: Partial<TContext>,
) => {
  return {
    ...current,
    context: { ...current.context, ...patch },
  };
};

const setStep = <
  StepId extends string,
  TContext extends object = Record<string, unknown>,
>(
  current: ProgressionState<StepId, TContext>,
  step: StepId,
) => {
  return {
    ...current,
    step,
  };
};

function deepFreezeObject(value: unknown, seen: WeakSet<object>) {
  if (!value || typeof value !== 'object' || seen.has(value)) {
    return;
  }

  seen.add(value);
  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreezeObject(nestedValue, seen);
  }
}

function createReadonlySnapshot<T extends object>(value: T): DeepReadonly<T> {
  const snapshot = structuredClone(value);
  deepFreezeObject(snapshot, new WeakSet<object>());
  return snapshot as DeepReadonly<T>;
}

function ErrorBody(props: {
  labels: {
    cancel?: string;
    errorTitle: string;
    errorDescription: string;
  };
  onCancel?: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4 py-10 text-center">
      <div className="space-y-2">
        <p className="font-semibold">{props.labels.errorTitle}</p>
        <p>{props.labels.errorDescription}</p>
      </div>
      {props.onCancel && props.labels.cancel ? (
        <button type="button" className="btn" onClick={props.onCancel}>
          {props.labels.cancel}
        </button>
      ) : null}
    </div>
  );
}

class ProgressionStepErrorBoundary extends React.Component<
  ProgressionStepErrorBoundaryProps,
  ProgressionStepErrorBoundaryState
> {
  public state: ProgressionStepErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ProgressionStepErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidUpdate(
    previousProps: ProgressionStepErrorBoundaryProps,
  ): void {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

/**
 * Shared progression runtime for workflow-style flows.
 *
 * This component is intentionally narrow and opinionated. Treat it as a
 * contract, not as a toolkit.
 *
 * Core model:
 *
 * - `facts` are immutable setup-time inputs for the entire flow.
 * - `context` is the only mutable runtime state for the flow.
 * - `steps` is the golden path order for implicit `advance: true` and `goBack:
 *   true`.
 * - `stepMap` is the full set of named renderable steps, including branch-only
 *   steps that are reachable by explicit step id.
 *
 * Step contract:
 *
 * - Every step receives deep-readonly snapshots of `facts` and `context`.
 * - A step must never mutate either object in place.
 * - A step must use `runtimePatch` to persist runtime changes.
 * - A step that is not ready to render should suspend. Do not use `return null`
 *   as a loading protocol.
 *
 * Shared UI behavior:
 *
 * - Suspended steps show the shared loading body.
 * - Thrown render errors show the shared error body.
 * - Missing `stepMap` entries are treated as programmer errors and are routed
 *   through the shared error boundary.
 *
 * Completion and cancellation:
 *
 * - `onComplete` receives the exact runtime context that produced completion.
 * - `onCancel` receives the exact runtime context that produced cancellation.
 * - Those callbacks are delivered after commit via `React.useEffect`; do not move
 *   them into render or state updaters.
 *
 * Design rules:
 *
 * - Push business decisions upward into flow-local `steps`, `facts`,
 *   `initialContext`, and `onComplete` / `onCancel` handlers.
 * - Push reusable utilities downward into pure helpers.
 * - Reuse step components across flows; do not create progression wrappers, local
 *   shim contracts, or adapter layers around this component.
 *
 * Do not edit this component casually. Do not extend or fork its public types
 * locally to fit app-specific behavior. If a flow feels awkward, fix the flow
 * composition or the step component first. Only change this shared contract
 * when the contract itself is wrong and the change is intended for every
 * consumer.
 */
export const Progression = <
  StepId extends string,
  TFacts extends object = Record<string, unknown>,
  TContext extends object = Record<string, unknown>,
>({
  className,
  initialContext,
  labels,
  steps,
  stepMap,
  onComplete,
  onCancel,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  steps: StepId[];
  facts: TFacts;
  initialContext: TContext;
  labels: {
    loading: string;
    cancel?: string;
    errorTitle: string;
    errorDescription: string;
  };
  stepMap: Record<StepId, ProgressionStepComponent<StepId, TFacts, TContext>>;
  onComplete: (context: TContext) => void;
  onCancel?: (context: TContext) => void;
}) => {
  const [state, setState] = useState<ProgressionState<StepId, TContext>>(() => {
    if (steps.length === 0) {
      throw new Error('Progression must have at least one step');
    }
    return {
      progress: 0,
      step: steps[0],
      context: initialContext,
      result: null,
    };
  });
  const facts = useMemo(() => createReadonlySnapshot(props.facts), []);

  React.useEffect(() => {
    if (state.result === 'completed') {
      onComplete(state.context);
    } else if (state.result === 'cancelled' && onCancel) {
      onCancel(state.context);
    } else {
      return;
    }

    setState((current) => {
      if (current.result !== state.result) {
        return current;
      }

      return {
        ...current,
        result: null,
      };
    });
  }, [state.context, state.result, onCancel, onComplete]);

  const setProgress = (
    current: ProgressionState<StepId, TContext>,
    progress: number,
  ): ProgressionState<StepId, TContext> => {
    return {
      ...current,
      progress,
      step: steps[progress],
    };
  };

  const handleBack = (change: BackChange<StepId, TContext>) => {
    setState((current: ProgressionState<StepId, TContext>) => {
      if (change.runtimePatch) {
        current = patchContext(current, change.runtimePatch);
      }

      if (change.goBack === true) {
        const currentIndex = steps.indexOf(current.step);

        if (currentIndex === -1) {
          // If the current step isn't in the path, go back to the last step in the path.
          return setStep(current, steps[current.progress]);
        }

        if (current.progress <= 0) {
          if (onCancel) {
            return {
              ...current,
              result: 'cancelled',
            };
          } else {
            return current;
          }
        }

        return setProgress(current, current.progress - 1);
      } else if (change.goBack) {
        current = setStep(current, change.goBack);
      }

      return current;
    });
  };

  const handleProceed = (change: ProceedChange<StepId, TContext>) => {
    setState((current: ProgressionState<StepId, TContext>) => {
      if (change.runtimePatch) {
        current = patchContext(current, change.runtimePatch);
      }

      if (change.advance === true) {
        if (current.progress >= steps.length - 1) {
          // If we're advancing past the last step, call onComplete instead of advancing
          return {
            ...current,
            result: 'completed',
          };
        }

        return setProgress(current, current.progress + 1);
      } else if (change.advance) {
        return setStep(current, change.advance);
      }

      return current;
    });
  };

  const contextSnapshot = useMemo(
    () => createReadonlySnapshot(state.context),
    [state.context, state.step],
  );
  const MissingComponent: ProgressionStepComponent<
    StepId,
    TFacts,
    TContext
  > = () => {
    throw new Error(`Missing render step map entry for "${state.step}"`);
  };
  const Component = stepMap[state.step] ?? MissingComponent;
  const canGoBack = state.progress > 0 || !!onCancel;
  const componentProps: ProgressionStepProps<StepId, TFacts, TContext> = {
    facts,
    context: contextSnapshot,
    onProceed: handleProceed,
    onBack: canGoBack ? handleBack : undefined,
  };
  const loadingBody = (
    <div className="flex w-full justify-center py-10">
      <div className="loading loading-spinner loading-lg" />
      <span className="sr-only">{labels.loading}</span>
    </div>
  );
  const errorBody = (
    <ErrorBody
      labels={labels}
      onCancel={
        onCancel &&
        (() => setState((current) => ({ ...current, result: 'cancelled' })))
      }
    />
  );

  return (
    <div className={cn(className)} {...props}>
      <ProgressionStepErrorBoundary resetKey={state.step} fallback={errorBody}>
        <React.Suspense fallback={loadingBody}>
          {React.createElement(Component, componentProps)}
        </React.Suspense>
      </ProgressionStepErrorBoundary>
    </div>
  );
};
