/**
 * Owns dependency-sensitive context value entries for workflow steps. Context
 * values are stored in workflow context so current values can survive
 * forward/back movement.
 */

export type WorkflowContextValueData = Record<string, unknown>;

export type WorkflowContextValue = {
  dependencies: ReadonlyArray<unknown>;
  data: WorkflowContextValueData;
};

export type WorkflowContextValues = Record<string, WorkflowContextValue>;

export type WorkflowContextValueSetAction =
  | WorkflowContextValueData
  | ((current: WorkflowContextValueData) => WorkflowContextValueData);

export const EMPTY_WORKFLOW_CONTEXT_VALUES: WorkflowContextValues =
  Object.freeze({});

function assertValidContextValueId(contextValueId: string): string {
  const normalizedContextValueId = contextValueId.trim();
  if (!normalizedContextValueId) {
    throw new Error("Workflow context value id is required");
  }
  return normalizedContextValueId;
}

function isWorkflowContextValueData(
  value: unknown,
): value is WorkflowContextValueData {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function assertWorkflowContextValueData(
  data: unknown,
): WorkflowContextValueData {
  if (!isWorkflowContextValueData(data)) {
    throw new Error("Workflow context value data must be an object");
  }
  return data;
}

function toDependencySnapshot(
  dependencies: ReadonlyArray<unknown>,
): ReadonlyArray<unknown> {
  return [...dependencies];
}

function hasSameDependencies(params: {
  left: ReadonlyArray<unknown>;
  right: ReadonlyArray<unknown>;
}): boolean {
  const { left, right } = params;
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (!Object.is(left[index], right[index])) return false;
  }
  return true;
}

export function getWorkflowContextValuesSafe(
  contextValues: WorkflowContextValues | null | undefined,
): WorkflowContextValues {
  return contextValues ?? EMPTY_WORKFLOW_CONTEXT_VALUES;
}

export function createEmptyWorkflowContextValues(): WorkflowContextValues {
  return {};
}

export function ensureWorkflowContextValue(params: {
  contextValues: WorkflowContextValues | null | undefined;
  contextValueId: string;
  dependencies: ReadonlyArray<unknown>;
  createInitialData: () => WorkflowContextValueData;
}): { data: WorkflowContextValueData; contextValues: WorkflowContextValues } {
  const normalizedContextValueId = assertValidContextValueId(
    params.contextValueId,
  );
  const contextValues = getWorkflowContextValuesSafe(params.contextValues);
  const dependencySnapshot = toDependencySnapshot(params.dependencies);
  const existingContextValue = contextValues[normalizedContextValueId];
  if (
    existingContextValue &&
    hasSameDependencies({
      left: existingContextValue.dependencies,
      right: dependencySnapshot,
    })
  ) {
    return {
      data: existingContextValue.data,
      contextValues,
    };
  }

  const nextData = assertWorkflowContextValueData(params.createInitialData());
  const nextContextValues: WorkflowContextValues = {
    ...contextValues,
    [normalizedContextValueId]: {
      dependencies: dependencySnapshot,
      data: nextData,
    },
  };
  return {
    data: nextData,
    contextValues: nextContextValues,
  };
}

export function setWorkflowContextValueData(params: {
  contextValues: WorkflowContextValues | null | undefined;
  contextValueId: string;
  next: WorkflowContextValueSetAction;
}): WorkflowContextValues {
  const normalizedContextValueId = assertValidContextValueId(
    params.contextValueId,
  );
  const contextValues = getWorkflowContextValuesSafe(params.contextValues);
  const existingContextValue = contextValues[normalizedContextValueId];
  if (!existingContextValue) {
    throw new Error(
      `Workflow context value "${normalizedContextValueId}" is not initialized`,
    );
  }

  const resolvedData =
    typeof params.next === "function"
      ? params.next(existingContextValue.data)
      : params.next;
  const nextData = assertWorkflowContextValueData(resolvedData);
  if (Object.is(nextData, existingContextValue.data)) return contextValues;

  return {
    ...contextValues,
    [normalizedContextValueId]: {
      ...existingContextValue,
      data: nextData,
    },
  };
}
