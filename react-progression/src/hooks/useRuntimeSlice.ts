/**
 * Owns the React helper for reading and updating workflow runtime slices. It
 * writes through to durable workflow context once slices are initialized.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  assertRuntimeSliceData,
  ensureRuntimeSlice,
  setRuntimeSliceData,
  type RuntimeSliceData,
  type RuntimeSlices,
  type SliceSetStateAction,
} from '../lib/runtime-slices.js';

export function useRuntimeSlice(params: {
  slices: RuntimeSlices | null | undefined;
  applySlices: (nextSlices: RuntimeSlices) => void;
  sliceId: string;
  dependencies: ReadonlyArray<unknown>;
  createInitialData: () => RuntimeSliceData;
}): {
  data: RuntimeSliceData;
  setData: (next: SliceSetStateAction) => void;
} {
  const { slices, applySlices, sliceId, dependencies, createInitialData } =
    params;
  const isInitialized = Boolean(slices);
  const resolved = useMemo(
    () =>
      isInitialized
        ? ensureRuntimeSlice({
            slices,
            sliceId,
            dependencies,
            createInitialData,
          })
        : null,
    [createInitialData, dependencies, isInitialized, sliceId, slices],
  );
  const [localState, setLocalState] = useState(() => {
    if (resolved) {
      return resolved.data;
    }

    return assertRuntimeSliceData(createInitialData());
  });
  const resolvedData = resolved ? resolved.data : localState;

  const setData = useCallback(
    (next: SliceSetStateAction) => {
      setLocalState((currentState) => {
        const currentData = resolved ? resolved.data : currentState;
        const resolvedNextData =
          typeof next === 'function' ? next(currentData) : next;
        const nextData = assertRuntimeSliceData(resolvedNextData);
        if (Object.is(nextData, currentData)) {
          return currentState;
        }
        if (!isInitialized || !resolved) {
          return nextData;
        }

        const nextSlices = setRuntimeSliceData({
          slices: resolved.slices,
          sliceId,
          next: nextData,
        });
        if (nextSlices !== resolved.slices) {
          applySlices(nextSlices);
        }

        return nextData;
      });
    },
    [applySlices, isInitialized, resolved, sliceId],
  );

  return {
    data: resolvedData,
    setData,
  };
}
