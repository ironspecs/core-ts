/**
 * Owns the in-memory workflow runtime machine. The machine keeps the immutable
 * operation plan, active cursor, and durable runtime context together.
 */

import type { WorkflowOperation } from '../types/workflow.js';

export type WorkflowProgress = {
  current: number;
  total: number;
};

export type WorkflowRuntimeState<
  Facts,
  RuntimeContext extends Record<string, unknown>,
  Requirement extends string = string,
  BlockId extends string = string,
  SkipId extends string = string,
> = {
  facts: Readonly<Facts>;
  operations: ReadonlyArray<
    WorkflowOperation<Facts, RuntimeContext, Requirement, BlockId, SkipId>
  >;
  cursor: number;
  runtimeContext: RuntimeContext;
};

function cloneState<
  Facts,
  RuntimeContext extends Record<string, unknown>,
  Requirement extends string,
  BlockId extends string,
  SkipId extends string,
>(
  state: WorkflowRuntimeState<
    Facts,
    RuntimeContext,
    Requirement,
    BlockId,
    SkipId
  >,
): WorkflowRuntimeState<
  Facts,
  RuntimeContext,
  Requirement,
  BlockId,
  SkipId
> {
  return {
    ...state,
    runtimeContext: { ...state.runtimeContext },
  };
}

function clampRuntimeCursor(params: { cursor: number; size: number }): number {
  const { cursor, size } = params;
  if (size <= 0) return 0;
  if (cursor < 0) return 0;
  if (cursor > size) return size;
  return cursor;
}

export function resolveNextCursor(params: { cursor: number; size: number }) {
  const { cursor, size } = params;
  if (size <= 0) return 0;
  return Math.min(cursor + 1, size);
}

export function resolvePreviousStepCursor<
  Facts,
  RuntimeContext extends Record<string, unknown>,
  Requirement extends string = string,
  BlockId extends string = string,
  SkipId extends string = string,
>(params: {
  cursor: number;
  operations: ReadonlyArray<
    WorkflowOperation<Facts, RuntimeContext, Requirement, BlockId, SkipId>
  >;
}): number | null {
  const { cursor, operations } = params;
  for (let index = cursor - 1; index >= 0; index -= 1) {
    if (operations[index]?.kind === 'step') return index;
  }
  return null;
}

export function resolveWorkflowProgress(params: {
  cursor: number;
  total: number;
}): WorkflowProgress {
  const { cursor, total } = params;
  if (total === 0) return { current: 0, total: 0 };
  return {
    current: Math.min(cursor + 1, total),
    total,
  };
}

export function createWorkflowRuntimeMachine<
  Facts,
  RuntimeContext extends Record<string, unknown>,
  Requirement extends string = string,
  BlockId extends string = string,
  SkipId extends string = string,
>(params: {
  initialState: WorkflowRuntimeState<
    Facts,
    RuntimeContext,
    Requirement,
    BlockId,
    SkipId
  >;
}) {
  let state = cloneState(params.initialState);

  const getState = () => cloneState(state);

  const setCursor = (cursor: number) => {
    state = {
      ...state,
      cursor: clampRuntimeCursor({
        cursor,
        size: state.operations.length,
      }),
    };
  };

  const advance = () => {
    setCursor(
      resolveNextCursor({
        cursor: state.cursor,
        size: state.operations.length,
      }),
    );
  };

  const backToPreviousStep = () => {
    const previousStepCursor = resolvePreviousStepCursor({
      cursor: state.cursor,
      operations: state.operations,
    });
    if (previousStepCursor === null) return;
    setCursor(previousStepCursor);
  };

  const patchRuntimeContext = (patch: Partial<RuntimeContext>) => {
    state = {
      ...state,
      runtimeContext: {
        ...state.runtimeContext,
        ...patch,
      },
    };
  };

  const setRuntimeContext = (runtimeContext: RuntimeContext) => {
    state = {
      ...state,
      runtimeContext: { ...runtimeContext },
    };
  };

  const isComplete = () => state.cursor >= state.operations.length;

  return {
    getState,
    setCursor,
    advance,
    backToPreviousStep,
    patchRuntimeContext,
    setRuntimeContext,
    isComplete,
  };
}
