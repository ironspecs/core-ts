/**
 * Owns the React helper for reading and updating one workflow context value
 * entry. It writes through to durable workflow context once context values are
 * initialized.
 */

import { useCallback, useMemo, useState } from "react";
import {
  assertWorkflowContextValueData,
  ensureWorkflowContextValue,
  setWorkflowContextValueData,
  type WorkflowContextValueData,
  type WorkflowContextValues,
  type WorkflowContextValueSetAction,
} from "../lib/workflow-context-values.js";

export function useWorkflowContextValue(params: {
  contextValues: WorkflowContextValues | null | undefined;
  applyContextValues: (nextContextValues: WorkflowContextValues) => void;
  contextValueId: string;
  dependencies: ReadonlyArray<unknown>;
  createInitialData: () => WorkflowContextValueData;
}): {
  data: WorkflowContextValueData;
  setData: (next: WorkflowContextValueSetAction) => void;
} {
  const {
    contextValues,
    applyContextValues,
    contextValueId,
    dependencies,
    createInitialData,
  } = params;
  const isInitialized = Boolean(contextValues);
  const resolved = useMemo(
    () =>
      isInitialized
        ? ensureWorkflowContextValue({
            contextValues,
            contextValueId,
            dependencies,
            createInitialData,
          })
        : null,
    [
      createInitialData,
      dependencies,
      isInitialized,
      contextValueId,
      contextValues,
    ],
  );
  const [localState, setLocalState] = useState(() => {
    if (resolved) {
      return resolved.data;
    }

    return assertWorkflowContextValueData(createInitialData());
  });
  const resolvedData = resolved ? resolved.data : localState;

  const setData = useCallback(
    (next: WorkflowContextValueSetAction) => {
      setLocalState((currentState) => {
        const currentData = resolved ? resolved.data : currentState;
        const resolvedNextData =
          typeof next === "function" ? next(currentData) : next;
        const nextData = assertWorkflowContextValueData(resolvedNextData);
        if (Object.is(nextData, currentData)) {
          return currentState;
        }
        if (!isInitialized || !resolved) {
          return nextData;
        }

        const nextContextValues = setWorkflowContextValueData({
          contextValues: resolved.contextValues,
          contextValueId,
          next: nextData,
        });
        if (nextContextValues !== resolved.contextValues) {
          applyContextValues(nextContextValues);
        }

        return nextData;
      });
    },
    [applyContextValues, isInitialized, resolved, contextValueId],
  );

  return {
    data: resolvedData,
    setData,
  };
}
