/**
 * Owns pure workflow plan construction helpers. Plans are compiled from facts,
 * context, and checkers, then frozen so a workflow run cannot reorder or
 * replace its operation list after it starts.
 */

import type {
  WorkflowChecker,
  WorkflowOperation,
  WorkflowOperationControl,
  WorkflowOperationParams,
  WorkflowSkipOperation,
  WorkflowStepOperation,
} from '../types/workflow.js';

export type StepOperationFactoryParams<
  Requirement extends string = string,
  BlockId extends string = string,
> = {
  operationId: string;
  checkerId: string;
  blockId: BlockId;
  requirements?: Requirement[];
};

export type SkipOperationFactoryParams<
  Facts,
  RuntimeContext,
  Requirement extends string = string,
  SkipId extends string = string,
> = {
  operationId: string;
  checkerId: string;
  skipId: SkipId;
  requirements?: Requirement[];
  run?: (
    params: WorkflowOperationParams<Facts, RuntimeContext> & {
      operation: Extract<WorkflowOperationControl, { kind: 'skip' }>;
    },
  ) => Promise<RuntimeContext> | RuntimeContext;
};

function assertNonEmptyString<Value extends string>(params: {
  value: Value;
  label: string;
}): Value {
  const normalized = params.value.trim();
  if (!normalized) {
    throw new Error(`${params.label} is required`);
  }
  return params.value;
}

function noOpStep<Facts, RuntimeContext>(
  params: WorkflowOperationParams<Facts, RuntimeContext> & {
    operation: Extract<WorkflowOperationControl, { kind: 'step' }>;
  },
): RuntimeContext {
  return params.context;
}

function noOpSkip<Facts, RuntimeContext>(
  params: WorkflowOperationParams<Facts, RuntimeContext> & {
    operation: Extract<WorkflowOperationControl, { kind: 'skip' }>;
  },
): RuntimeContext {
  return params.context;
}

function freezeOperationList<
  Facts,
  RuntimeContext,
  Requirement extends string,
  BlockId extends string,
  SkipId extends string,
>(
  operations: WorkflowOperation<
    Facts,
    RuntimeContext,
    Requirement,
    BlockId,
    SkipId
  >[],
): ReadonlyArray<
  WorkflowOperation<Facts, RuntimeContext, Requirement, BlockId, SkipId>
> {
  return Object.freeze([...operations]);
}

function assertUniqueOperationIds<
  Facts,
  RuntimeContext,
  Requirement extends string,
  BlockId extends string,
  SkipId extends string,
>(
  operations: WorkflowOperation<
    Facts,
    RuntimeContext,
    Requirement,
    BlockId,
    SkipId
  >[],
): void {
  const seenOperationIds = new Set<string>();
  for (const operation of operations) {
    const operationId = operation.operationId;
    if (seenOperationIds.has(operationId)) {
      throw new Error(`Duplicate workflow operation id: "${operationId}"`);
    }
    seenOperationIds.add(operationId);
  }
}

function freezeFacts<Facts extends Record<string, unknown>>(
  facts: Facts,
): Readonly<Facts> {
  return Object.freeze({ ...facts });
}

function cloneRuntimeContext<RuntimeContext extends Record<string, unknown>>(
  runtimeContext: RuntimeContext,
): RuntimeContext {
  return { ...runtimeContext };
}

function cloneSharedContext<SharedContext extends Record<string, unknown>>(
  context: SharedContext,
): SharedContext {
  return { ...context };
}

export function createStepOperation<
  Facts,
  RuntimeContext,
  Requirement extends string = string,
  BlockId extends string = string,
>(
  params: StepOperationFactoryParams<Requirement, BlockId>,
): WorkflowStepOperation<Facts, RuntimeContext, Requirement, BlockId> {
  const operationId = assertNonEmptyString({
    value: params.operationId,
    label: 'Workflow step operation id',
  });
  const checkerId = assertNonEmptyString({
    value: params.checkerId,
    label: 'Workflow step checker id',
  });
  const blockId = assertNonEmptyString({
    value: params.blockId,
    label: 'Workflow step block id',
  });

  const run: WorkflowStepOperation<
    Facts,
    RuntimeContext,
    Requirement,
    BlockId
  > = Object.assign(
    (
      operationParams: WorkflowOperationParams<Facts, RuntimeContext> & {
        operation: Extract<WorkflowOperationControl, { kind: 'step' }>;
      },
    ) => noOpStep(operationParams),
    {
      kind: 'step' as const,
      operationId,
      checkerId,
      blockId,
      requirements: [...(params.requirements ?? [])],
    },
  );

  return Object.freeze(run);
}

export function createSkipOperation<
  Facts,
  RuntimeContext,
  Requirement extends string = string,
  SkipId extends string = string,
>(
  params: SkipOperationFactoryParams<
    Facts,
    RuntimeContext,
    Requirement,
    SkipId
  >,
): WorkflowSkipOperation<Facts, RuntimeContext, Requirement, SkipId> {
  const operationId = assertNonEmptyString({
    value: params.operationId,
    label: 'Workflow skip operation id',
  });
  const checkerId = assertNonEmptyString({
    value: params.checkerId,
    label: 'Workflow skip checker id',
  });
  const skipId = assertNonEmptyString({
    value: params.skipId,
    label: 'Workflow skip id',
  });

  const run: WorkflowSkipOperation<
    Facts,
    RuntimeContext,
    Requirement,
    SkipId
  > = Object.assign(
    (
      operationParams: WorkflowOperationParams<Facts, RuntimeContext> & {
        operation: Extract<WorkflowOperationControl, { kind: 'skip' }>;
      },
    ) => (params.run ?? noOpSkip)(operationParams),
    {
      kind: 'skip' as const,
      operationId,
      checkerId,
      skipId,
      requirements: [...(params.requirements ?? [])],
    },
  );

  return Object.freeze(run);
}

export async function compileWorkflowPlan<
  Facts extends Record<string, unknown>,
  RuntimeContext extends Record<string, unknown>,
  SharedContext extends Record<string, unknown>,
  Requirement extends string = string,
  BlockId extends string = string,
  SkipId extends string = string,
>(params: {
  facts: Facts;
  runtimeContext: RuntimeContext;
  context: SharedContext;
  checkers: WorkflowChecker<
    Facts,
    RuntimeContext,
    Requirement,
    BlockId,
    SkipId
  >[];
  applyContext?: (params: {
    context: SharedContext;
    runtimeContext: RuntimeContext;
  }) => SharedContext;
}): Promise<{
  operations: ReadonlyArray<
    WorkflowOperation<Facts, RuntimeContext, Requirement, BlockId, SkipId>
  >;
  context: SharedContext;
  runtimeContext: RuntimeContext;
}> {
  const facts = freezeFacts(params.facts);
  const runtimeContext = cloneRuntimeContext(params.runtimeContext);
  let plannerContext = cloneSharedContext(params.context);
  const operations: WorkflowOperation<
    Facts,
    RuntimeContext,
    Requirement,
    BlockId,
    SkipId
  >[] = [];
  const participatingCheckers = params.checkers.filter((checker) =>
    checker.shouldHandle(facts),
  );

  for (const checker of participatingCheckers) {
    const nextOperations = await checker.createOperations(
      facts,
      runtimeContext,
    );
    if (!Array.isArray(nextOperations)) {
      throw new Error(`Checker "${checker.id}" must return an operation list`);
    }
    operations.push(...nextOperations);
    if (params.applyContext) {
      plannerContext = params.applyContext({
        context: plannerContext,
        runtimeContext,
      });
    }
  }

  assertUniqueOperationIds(operations);
  return {
    operations: freezeOperationList(operations),
    context: plannerContext,
    runtimeContext,
  };
}

export function listRenderableWorkflowOps<
  Facts,
  RuntimeContext,
  Requirement extends string = string,
  BlockId extends string = string,
  SkipId extends string = string,
>(
  operations: ReadonlyArray<
    WorkflowOperation<Facts, RuntimeContext, Requirement, BlockId, SkipId>
  >,
): WorkflowStepOperation<Facts, RuntimeContext, Requirement, BlockId>[] {
  return operations.filter(
    (
      operation,
    ): operation is WorkflowStepOperation<
      Facts,
      RuntimeContext,
      Requirement,
      BlockId
    > => operation.kind === 'step',
  );
}

export function listSkippableWorkflowOps<
  Facts,
  RuntimeContext,
  Requirement extends string = string,
  BlockId extends string = string,
  SkipId extends string = string,
>(
  operations: ReadonlyArray<
    WorkflowOperation<Facts, RuntimeContext, Requirement, BlockId, SkipId>
  >,
): WorkflowSkipOperation<Facts, RuntimeContext, Requirement, SkipId>[] {
  return operations.filter(
    (
      operation,
    ): operation is WorkflowSkipOperation<
      Facts,
      RuntimeContext,
      Requirement,
      SkipId
    > => operation.kind === 'skip',
  );
}

export function clampWorkflowCursor(params: {
  cursor: number;
  size: number;
}): number {
  const { cursor, size } = params;
  if (size <= 0) return 0;
  if (cursor < 0) return 0;
  if (cursor >= size) return size - 1;
  return cursor;
}
