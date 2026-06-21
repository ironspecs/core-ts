/**
 * Owns React hooks over the workflow runtime machine. The hooks compile a fixed
 * plan once per facts key and expose controls that update cursor and context
 * without replanning the active workflow.
 */

import { listRenderableWorkflowOps } from '../lib/workflow.js';
import type {
  WorkflowChecker,
  WorkflowOperation,
  WorkflowStepOperation,
} from '../types/workflow.js';
import {
  createWorkflowRuntimeMachine,
  resolvePreviousStepCursor,
  resolveWorkflowProgress,
  type WorkflowRuntimeState,
} from '../lib/workflow-runtime.js';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';

export type WorkflowPlanFailure = {
  stage: 'compile' | 'skip';
  operationId: string | null;
  error: Error;
};

export type ProgressionWorkflowPhase<StepId extends string> =
  | { kind: 'loading' }
  | { kind: 'step'; stepId: StepId }
  | { kind: 'complete' }
  | { kind: 'error'; recoverable: true; message: string };

export type ProgressionWorkflowProgress = {
  currentStepNumber: number;
  totalBlocks: number;
  percentComplete: number;
};

export type ProgressionWorkflowResult<
  StepId extends string,
  RuntimeContext extends Record<string, unknown>,
> = {
  phase: ProgressionWorkflowPhase<StepId>;
  progress: ProgressionWorkflowProgress | null;
  stepIds: readonly StepId[];
  runtimeContext: RuntimeContext | null;
  canGoBack: boolean;
  controls: {
    proceed: () => void;
    back: () => void;
    setCursor: (nextCursor: number | ((current: number) => number)) => void;
    retry: () => void;
    patchRuntimeContext: (patch: Partial<RuntimeContext>) => void;
  };
};

type CompileWorkflowPlanResult<
  Facts,
  RuntimeContext,
  SharedContext,
  Requirement extends string,
  BlockId extends string,
  SkipId extends string,
> = {
  operations: ReadonlyArray<
    WorkflowOperation<Facts, RuntimeContext, Requirement, BlockId, SkipId>
  >;
  context: SharedContext;
  runtimeContext: RuntimeContext;
};
type CompileWorkflowPlanFn<
  Facts,
  RuntimeContext,
  SharedContext,
  Requirement extends string,
  BlockId extends string,
  SkipId extends string,
> = (params: {
  facts: Readonly<Facts>;
  runtimeContext: RuntimeContext;
  context: SharedContext;
  checkers?: WorkflowChecker<
    Facts,
    RuntimeContext,
    Requirement,
    BlockId,
    SkipId
  >[];
}) => Promise<
  CompileWorkflowPlanResult<
    Facts,
    RuntimeContext,
    SharedContext,
    Requirement,
    BlockId,
    SkipId
  >
>;

function toErrorSafe(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error('Unknown workflow runtime error');
}

function freezeFacts<Facts extends Record<string, unknown>>(
  facts: Facts,
): Readonly<Facts> {
  return Object.freeze({
    ...facts,
  });
}

export function useWorkflowRuntime<
  Facts extends Record<string, unknown>,
  RuntimeContext extends Record<string, unknown>,
  SharedContext,
  Requirement extends string = string,
  BlockId extends string = string,
  SkipId extends string = string,
>(params: {
  facts: Facts;
  factsKey: string;
  runtimeContext: RuntimeContext | null;
  createInitialContext: () => SharedContext;
  compilePlan: CompileWorkflowPlanFn<
    Facts,
    RuntimeContext,
    SharedContext,
    Requirement,
    BlockId,
    SkipId
  >;
  checkers?: WorkflowChecker<
    Facts,
    RuntimeContext,
    Requirement,
    BlockId,
    SkipId
  >[];
  advanceContext?: (context: SharedContext) => SharedContext;
  patchContext?: (params: {
    context: SharedContext;
    patch: Partial<RuntimeContext>;
  }) => SharedContext;
}) {
  type RuntimeSnapshot = {
    failure: WorkflowPlanFailure | null;
    hasCompiledPlan: boolean;
    isExecutingSkip: boolean;
    resetVersion: number;
    runtimeSeedContext: RuntimeContext | null;
    runtimeState: WorkflowRuntimeState<
      Facts,
      RuntimeContext,
      Requirement,
      BlockId,
      SkipId
    > | null;
  };
  type RuntimeStore = {
    advance: () => void;
    applyRuntimeContextPatch: (patch: Partial<RuntimeContext>) => void;
    getSnapshot: () => RuntimeSnapshot;
    goBack: () => void;
    resetPlan: () => void;
    retry: () => void;
    setCursor: (nextCursor: number | ((current: number) => number)) => void;
    setInputs: (nextParams: typeof params) => void;
    subscribe: (listener: () => void) => () => void;
  };

  const storeRef = useRef<RuntimeStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = (() => {
      const listeners = new Set<() => void>();
      let currentParams = params;
      let generation = 0;
      let compileGeneration: number | null = null;
      let skipGeneration: number | null = null;
      let currentFactsKey = params.factsKey;
      let machine: ReturnType<
        typeof createWorkflowRuntimeMachine<
          Facts,
          RuntimeContext,
          Requirement,
          BlockId,
          SkipId
        >
      > | null = null;
      let sharedContext: SharedContext | null = params.createInitialContext();
      let factsRef = freezeFacts(params.facts);
      let snapshot: RuntimeSnapshot = {
        failure: null,
        hasCompiledPlan: false,
        isExecutingSkip: false,
        resetVersion: 0,
        runtimeSeedContext: null,
        runtimeState: null,
      };

      function emit() {
        listeners.forEach((listener) => listener());
      }

      function setSnapshot(nextSnapshot: RuntimeSnapshot) {
        snapshot = nextSnapshot;
        emit();
      }

      function syncMachineState() {
        setSnapshot({
          ...snapshot,
          runtimeState: machine ? machine.getState() : null,
        });
      }

      function resetRuntime(nextResetVersion: number) {
        generation += 1;
        compileGeneration = null;
        skipGeneration = null;
        machine = null;
        sharedContext = currentParams.createInitialContext();
        factsRef = freezeFacts(currentParams.facts);
        setSnapshot({
          failure: null,
          hasCompiledPlan: false,
          isExecutingSkip: false,
          resetVersion: nextResetVersion,
          runtimeSeedContext: null,
          runtimeState: null,
        });
      }

      function executeReadySkipOperation() {
        const runtimeState = snapshot.runtimeState;
        const resolvedRuntimeContext = runtimeState?.runtimeContext ?? null;
        const activeOperation =
          runtimeState?.operations[runtimeState.cursor] ?? null;

        if (
          !snapshot.hasCompiledPlan ||
          !activeOperation ||
          !resolvedRuntimeContext ||
          snapshot.failure ||
          snapshot.isExecutingSkip ||
          activeOperation.kind !== 'skip'
        ) {
          return;
        }

        const activeGeneration = generation;
        skipGeneration = activeGeneration;
        setSnapshot({
          ...snapshot,
          isExecutingSkip: true,
        });

        Promise.resolve(
          activeOperation({
            facts: factsRef,
            context: resolvedRuntimeContext,
            operation: {
              kind: 'skip',
              controls: {
                onDone: () => {},
              },
            },
          }),
        )
          .then((nextContext) => {
            if (
              generation !== activeGeneration ||
              skipGeneration !== activeGeneration ||
              !machine
            ) {
              return;
            }
            machine.setRuntimeContext(nextContext);
            machine.advance();
            setSnapshot({
              ...snapshot,
              isExecutingSkip: false,
              runtimeState: machine.getState(),
            });
            executeReadySkipOperation();
          })
          .catch((error) => {
            const resolvedError = toErrorSafe(error);
            console.error(resolvedError);
            if (
              generation !== activeGeneration ||
              skipGeneration !== activeGeneration
            ) {
              return;
            }
            setSnapshot({
              ...snapshot,
              failure: {
                stage: 'skip',
                operationId: activeOperation.operationId,
                error: resolvedError,
              },
              isExecutingSkip: false,
            });
          });
      }

      function compileReadyWorkflowPlan() {
        if (
          !snapshot.runtimeSeedContext ||
          !sharedContext ||
          snapshot.hasCompiledPlan ||
          snapshot.failure ||
          compileGeneration !== null
        ) {
          return;
        }

        const activeGeneration = generation;
        const runtimeSeedContext = snapshot.runtimeSeedContext;
        compileGeneration = activeGeneration;
        currentParams
          .compilePlan({
            facts: factsRef,
            runtimeContext: runtimeSeedContext,
            context: sharedContext,
            checkers: currentParams.checkers,
          })
          .then((compiled) => {
            if (
              generation !== activeGeneration ||
              compileGeneration !== activeGeneration
            ) {
              return;
            }
            sharedContext = currentParams.advanceContext
              ? currentParams.advanceContext(compiled.context)
              : compiled.context;
            machine = createWorkflowRuntimeMachine({
              initialState: {
                facts: factsRef,
                operations: compiled.operations,
                cursor: 0,
                runtimeContext: compiled.runtimeContext,
              },
            });
            compileGeneration = null;
            setSnapshot({
              ...snapshot,
              hasCompiledPlan: true,
              runtimeState: machine.getState(),
            });
            executeReadySkipOperation();
          })
          .catch((error) => {
            const resolvedError = toErrorSafe(error);
            console.error(resolvedError);
            if (
              generation !== activeGeneration ||
              compileGeneration !== activeGeneration
            ) {
              return;
            }
            compileGeneration = null;
            setSnapshot({
              ...snapshot,
              failure: {
                stage: 'compile',
                operationId: null,
                error: resolvedError,
              },
            });
          });
      }

      return {
        subscribe(listener) {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        getSnapshot() {
          return snapshot;
        },
        setInputs(nextParams) {
          currentParams = nextParams;
          factsRef = freezeFacts(nextParams.facts);

          if (currentFactsKey !== nextParams.factsKey) {
            currentFactsKey = nextParams.factsKey;
            resetRuntime(snapshot.resetVersion);
          }

          if (nextParams.runtimeContext && !snapshot.runtimeSeedContext) {
            setSnapshot({
              ...snapshot,
              runtimeSeedContext: nextParams.runtimeContext,
            });
          }

          compileReadyWorkflowPlan();
          executeReadySkipOperation();
        },
        setCursor(nextCursor) {
          if (!machine) return;
          const currentCursor = machine.getState().cursor;
          const resolvedCursor =
            typeof nextCursor === 'function'
              ? nextCursor(currentCursor)
              : nextCursor;
          machine.setCursor(resolvedCursor);
          syncMachineState();
        },
        applyRuntimeContextPatch(patch) {
          if (!machine) return;
          machine.patchRuntimeContext(patch);
          if (sharedContext && currentParams.patchContext) {
            sharedContext = currentParams.patchContext({
              context: sharedContext,
              patch,
            });
          }
          syncMachineState();
        },
        advance() {
          if (!machine) return;
          machine.advance();
          syncMachineState();
          executeReadySkipOperation();
        },
        goBack() {
          if (!machine) return;
          machine.backToPreviousStep();
          syncMachineState();
        },
        retry() {
          if (!snapshot.failure) {
            return;
          }
          compileGeneration = null;
          skipGeneration = null;
          setSnapshot({
            ...snapshot,
            failure: null,
          });
          compileReadyWorkflowPlan();
          executeReadySkipOperation();
        },
        resetPlan() {
          resetRuntime(snapshot.resetVersion + 1);
          if (currentParams.runtimeContext) {
            setSnapshot({
              ...snapshot,
              runtimeSeedContext: currentParams.runtimeContext,
            });
          }
          compileReadyWorkflowPlan();
        },
      };
    })();
  }

  const store = storeRef.current;
  store.setInputs(params);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  const operations = snapshot.runtimeState?.operations ?? [];
  const cursor = snapshot.runtimeState?.cursor ?? 0;
  const resolvedRuntimeContext = snapshot.runtimeState?.runtimeContext ?? null;
  const blockOperations: WorkflowStepOperation<
    Facts,
    RuntimeContext,
    Requirement,
    BlockId
  >[] = useMemo(
    () => listRenderableWorkflowOps(operations),
    [operations],
  );
  const activeOperation = operations[cursor] ?? null;
  const activeBlock: WorkflowStepOperation<
    Facts,
    RuntimeContext,
    Requirement,
    BlockId
  > | null = activeOperation?.kind === 'step' ? activeOperation : null;
  const progress = useMemo(
    () => resolveWorkflowProgress({ cursor, total: operations.length }),
    [cursor, operations.length],
  );
  const canGoBack = useMemo(
    () =>
      resolvePreviousStepCursor({
        cursor,
        operations,
      }) !== null,
    [cursor, operations],
  );

  const setCursor = useCallback(
    (nextCursor: number | ((current: number) => number)) => {
      store.setCursor(nextCursor);
    },
    [store],
  );
  const applyRuntimeContextPatch = useCallback(
    (patch: Partial<RuntimeContext>) => {
      store.applyRuntimeContextPatch(patch);
    },
    [store],
  );
  const advance = useCallback(() => {
    store.advance();
  }, [store]);
  const goBack = useCallback(() => {
    store.goBack();
  }, [store]);
  const retry = useCallback(() => {
    store.retry();
  }, [store]);
  const resetPlan = useCallback(() => {
    store.resetPlan();
  }, [store]);

  return {
    operations,
    blockOperations,
    activeOperation,
    activeBlock,
    resolvedRuntimeContext,
    cursor,
    canGoBack,
    setCursor,
    advance,
    goBack,
    applyRuntimeContextPatch,
    hasCompiledPlan: snapshot.hasCompiledPlan,
    isExecutingSkip: snapshot.isExecutingSkip,
    progress,
    failure: snapshot.failure,
    retry,
    resetPlan,
    resetVersion: snapshot.resetVersion,
  };
}

function resolveProgressionWorkflowPhase<StepId extends string>(params: {
  failure: WorkflowPlanFailure | null;
  hasCompiledPlan: boolean;
  isExecutingSkip: boolean;
  totalStepCount: number;
  activeStep: StepId | null;
  allowEmptyPlanComplete: boolean;
  emptyPlanMessage: string;
}): ProgressionWorkflowPhase<StepId> {
  const {
    failure,
    hasCompiledPlan,
    isExecutingSkip,
    totalStepCount,
    activeStep,
    allowEmptyPlanComplete,
    emptyPlanMessage,
  } = params;
  if (failure) {
    return {
      kind: 'error',
      recoverable: true,
      message: failure.error.message || 'Workflow failed.',
    };
  }
  if (!hasCompiledPlan || isExecutingSkip) {
    return { kind: 'loading' };
  }
  if (totalStepCount === 0) {
    return allowEmptyPlanComplete
      ? { kind: 'complete' }
      : {
          kind: 'error',
          recoverable: true,
          message: emptyPlanMessage,
        };
  }
  if (activeStep) {
    return { kind: 'step', stepId: activeStep };
  }
  return { kind: 'complete' };
}

/** @internal */
export function resolveProgressionWorkflowProgressSafe<
  StepId extends string,
>(params: {
  phase: ProgressionWorkflowPhase<StepId>;
  stepIds: readonly StepId[];
}): {
  currentStepNumber: number;
  totalBlocks: number;
  percentComplete: number;
} | null {
  const { phase, stepIds } = params;
  if (phase.kind !== 'step') return null;
  const totalBlocks = stepIds.length;
  if (totalBlocks <= 0) return null;

  const currentIndex = stepIds.findIndex((stepId) => stepId === phase.stepId);
  if (currentIndex < 0) {
    throw new Error(`Workflow step "${phase.stepId}" is not in the fixed plan`);
  }
  const currentStepNumber = currentIndex + 1;

  return {
    currentStepNumber,
    totalBlocks,
    percentComplete: Math.round((currentStepNumber / totalBlocks) * 100),
  };
}

export function useProgressionWorkflow<
  Facts extends Record<string, unknown>,
  RuntimeContext extends Record<string, unknown>,
  SharedContext,
  Requirement extends string = string,
  BlockId extends string = string,
  SkipId extends string = string,
>(params: {
  facts: Facts;
  factsKey: string;
  runtimeContext: RuntimeContext | null;
  createInitialContext: () => SharedContext;
  compilePlan: CompileWorkflowPlanFn<
    Facts,
    RuntimeContext,
    SharedContext,
    Requirement,
    BlockId,
    SkipId
  >;
  checkers?: WorkflowChecker<
    Facts,
    RuntimeContext,
    Requirement,
    BlockId,
    SkipId
  >[];
  advanceContext?: (context: SharedContext) => SharedContext;
  patchContext?: (params: {
    context: SharedContext;
    patch: Partial<RuntimeContext>;
  }) => SharedContext;
  allowEmptyPlanComplete?: boolean;
  emptyPlanMessage?: string;
  onComplete?: (runtimeContext: RuntimeContext) => void;
}): ProgressionWorkflowResult<BlockId, RuntimeContext> {
  const runtime = useWorkflowRuntime<
    Facts,
    RuntimeContext,
    SharedContext,
    Requirement,
    BlockId,
    SkipId
  >(params);

  const onCompleteRef = useRef(params.onComplete);
  onCompleteRef.current = params.onComplete;

  const completionKeyRef = useRef<string | null>(null);

  const stepIds = useMemo(
    () => runtime.blockOperations.map((step) => step.blockId),
    [runtime.blockOperations],
  );
  const activeStep = runtime.activeBlock?.blockId ?? null;

  const phase = useMemo(
    () =>
      resolveProgressionWorkflowPhase({
        failure: runtime.failure,
        hasCompiledPlan: runtime.hasCompiledPlan,
        isExecutingSkip: runtime.isExecutingSkip,
        totalStepCount: stepIds.length,
        activeStep,
        allowEmptyPlanComplete: params.allowEmptyPlanComplete ?? false,
        emptyPlanMessage:
          params.emptyPlanMessage ?? 'Workflow plan produced no steps.',
      }),
    [
      runtime.failure,
      runtime.hasCompiledPlan,
      runtime.isExecutingSkip,
      stepIds.length,
      activeStep,
      params.allowEmptyPlanComplete,
      params.emptyPlanMessage,
    ],
  );

  const completionKey =
    phase.kind === 'complete' && runtime.resolvedRuntimeContext
      ? `${params.factsKey}:${runtime.resetVersion}`
      : null;

  useEffect(() => {
    if (!completionKey || !runtime.resolvedRuntimeContext) {
      completionKeyRef.current = null;
      return;
    }
    if (completionKeyRef.current === completionKey) {
      return;
    }
    completionKeyRef.current = completionKey;
    onCompleteRef.current?.(runtime.resolvedRuntimeContext);
  }, [completionKey, runtime.resolvedRuntimeContext]);

  const progress = useMemo(
    () =>
      resolveProgressionWorkflowProgressSafe({
        phase,
        stepIds,
      }),
    [phase, stepIds],
  );

  return {
    phase,
    progress,
    stepIds,
    runtimeContext: runtime.resolvedRuntimeContext,
    canGoBack: runtime.canGoBack,
    controls: {
      proceed: runtime.advance,
      back: runtime.goBack,
      setCursor: runtime.setCursor,
      retry: runtime.retry,
      patchRuntimeContext: runtime.applyRuntimeContextPatch,
    },
  };
}
