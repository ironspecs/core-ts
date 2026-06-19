/**
 * Owns runtime slices for workflow step-local draft state. Slices are stored in
 * runtime context so draft data can survive forward/back movement.
 */

export type RuntimeSliceData = Record<string, unknown>;

export type RuntimeSlice = {
  dependencies: ReadonlyArray<unknown>;
  data: RuntimeSliceData;
};

export type RuntimeSlices = Record<string, RuntimeSlice>;

export type SliceSetStateAction =
  | RuntimeSliceData
  | ((current: RuntimeSliceData) => RuntimeSliceData);

export const EMPTY_RUNTIME_SLICES: RuntimeSlices = Object.freeze({});

function assertValidSliceId(sliceId: string): string {
  const normalizedSliceId = sliceId.trim();
  if (!normalizedSliceId) {
    throw new Error('Runtime slice id is required');
  }
  return normalizedSliceId;
}

function isRuntimeSliceData(value: unknown): value is RuntimeSliceData {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function assertRuntimeSliceData(data: unknown): RuntimeSliceData {
  if (!isRuntimeSliceData(data)) {
    throw new Error('Runtime slice data must be an object');
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

export function getRuntimeSlicesSafe(
  slices: RuntimeSlices | null | undefined,
): RuntimeSlices {
  return slices ?? EMPTY_RUNTIME_SLICES;
}

export function createEmptyRuntimeSlices(): RuntimeSlices {
  return {};
}

export function ensureRuntimeSlice(params: {
  slices: RuntimeSlices | null | undefined;
  sliceId: string;
  dependencies: ReadonlyArray<unknown>;
  createInitialData: () => RuntimeSliceData;
}): { data: RuntimeSliceData; slices: RuntimeSlices } {
  const normalizedSliceId = assertValidSliceId(params.sliceId);
  const slices = getRuntimeSlicesSafe(params.slices);
  const dependencySnapshot = toDependencySnapshot(params.dependencies);
  const existingSlice = slices[normalizedSliceId];
  if (
    existingSlice &&
    hasSameDependencies({
      left: existingSlice.dependencies,
      right: dependencySnapshot,
    })
  ) {
    return {
      data: existingSlice.data,
      slices,
    };
  }

  const nextData = assertRuntimeSliceData(params.createInitialData());
  const nextSlices: RuntimeSlices = {
    ...slices,
    [normalizedSliceId]: {
      dependencies: dependencySnapshot,
      data: nextData,
    },
  };
  return {
    data: nextData,
    slices: nextSlices,
  };
}

export function setRuntimeSliceData(params: {
  slices: RuntimeSlices | null | undefined;
  sliceId: string;
  next: SliceSetStateAction;
}): RuntimeSlices {
  const normalizedSliceId = assertValidSliceId(params.sliceId);
  const slices = getRuntimeSlicesSafe(params.slices);
  const existingSlice = slices[normalizedSliceId];
  if (!existingSlice) {
    throw new Error(`Runtime slice "${normalizedSliceId}" is not initialized`);
  }

  const resolvedData =
    typeof params.next === 'function'
      ? params.next(existingSlice.data)
      : params.next;
  const nextData = assertRuntimeSliceData(resolvedData);
  if (Object.is(nextData, existingSlice.data)) return slices;

  return {
    ...slices,
    [normalizedSliceId]: {
      ...existingSlice,
      data: nextData,
    },
  };
}
