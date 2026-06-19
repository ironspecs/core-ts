/**
 * Verifies React workflow runtime hooks, including compile-once behavior, skip
 * execution, retry/reset, context patching, and progression workflow results.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { WorkflowOperation } from '../types/workflow';
import { createSkipOperation, createStepOperation } from '../lib/workflow';
import {
  resolveProgressionWorkflowProgressSafe,
  useWorkflowRuntime,
  useProgressionWorkflow,
} from './workflow';

type TestFacts = {
  accountId: string;
  userId: string;
};

type TestRuntimeContext = {
  applicationId: string | null;
  patched: boolean;
  skipRuns: number;
};

type TestSharedContext = {
  planVersion: number;
  patchCount: number;
  lastPatchedApplicationId: string | null;
};

function createFacts(overrides: Partial<TestFacts> = {}): TestFacts {
  return {
    accountId: 'acc_1',
    userId: 'uid_1',
    ...overrides,
  };
}

function createRuntimeContext(
  overrides: Partial<TestRuntimeContext> = {},
): TestRuntimeContext {
  return {
    applicationId: null,
    patched: false,
    skipRuns: 0,
    ...overrides,
  };
}

function createSharedContext(
  overrides: Partial<TestSharedContext> = {},
): TestSharedContext {
  return {
    planVersion: 0,
    patchCount: 0,
    lastPatchedApplicationId: null,
    ...overrides,
  };
}

function createStepOperations(): WorkflowOperation<
  TestFacts,
  TestRuntimeContext
>[] {
  return [
    createStepOperation<TestFacts, TestRuntimeContext>({
      operationId: 'flow/company',
      checkerId: 'flow-checker',
      blockId: 'company-name',
    }),
    createStepOperation<TestFacts, TestRuntimeContext>({
      operationId: 'flow/application',
      checkerId: 'flow-checker',
      blockId: 'application-name',
    }),
  ];
}

describe('useWorkflowRuntime', () => {
  it('compiles exactly once per facts key and recompiles when key changes', async () => {
    const compilePlan = vi.fn(
      async (params: {
        facts: TestFacts;
        runtimeContext: TestRuntimeContext;
        context: TestSharedContext;
      }) => {
        expect(Object.isFrozen(params.facts)).toBe(true);
        return {
          operations: createStepOperations(),
          context: {
            ...params.context,
            planVersion: params.context.planVersion + 1,
          },
          runtimeContext: params.runtimeContext,
        };
      },
    );

    const { rerender, result } = renderHook(
      (props: {
        facts: TestFacts;
        factsKey: string;
        runtimeContext: TestRuntimeContext | null;
      }) =>
        useWorkflowRuntime({
          facts: props.facts,
          factsKey: props.factsKey,
          runtimeContext: props.runtimeContext,
          createInitialContext: createSharedContext,
          compilePlan,
        }),
      {
        initialProps: {
          facts: createFacts(),
          factsKey: 'acc_1:uid_1',
          runtimeContext: createRuntimeContext(),
        },
      },
    );

    await waitFor(() => {
      expect(result.current.hasCompiledPlan).toBe(true);
      expect(result.current.operations).toHaveLength(2);
      expect(result.current.activeBlock?.blockId).toBe('company-name');
      expect(compilePlan).toHaveBeenCalledTimes(1);
    });

    rerender({
      facts: createFacts({ accountId: 'acc_1' }),
      factsKey: 'acc_1:uid_1',
      runtimeContext: createRuntimeContext({ applicationId: 'app_cached' }),
    });

    await waitFor(() => {
      expect(result.current.hasCompiledPlan).toBe(true);
    });
    expect(compilePlan).toHaveBeenCalledTimes(1);

    rerender({
      facts: createFacts({ userId: 'uid_2' }),
      factsKey: 'acc_1:uid_2',
      runtimeContext: createRuntimeContext({ applicationId: 'app_2' }),
    });

    await waitFor(() => {
      expect(result.current.hasCompiledPlan).toBe(true);
      expect(result.current.cursor).toBe(0);
      expect(compilePlan).toHaveBeenCalledTimes(2);
    });
  });

  it('auto-executes skip operations and goBack targets previous step only', async () => {
    const skipRun = vi.fn(
      async (params: {
        context: TestRuntimeContext;
        facts: Readonly<TestFacts>;
      }) => {
        expect(Object.isFrozen(params.facts)).toBe(true);
        return {
          ...params.context,
          skipRuns: params.context.skipRuns + 1,
        };
      },
    );

    const compilePlan = vi.fn(
      async (params: {
        runtimeContext: TestRuntimeContext;
        context: TestSharedContext;
      }) => ({
        operations: [
          createStepOperation<TestFacts, TestRuntimeContext>({
            operationId: 'flow/company',
            checkerId: 'flow-checker',
            blockId: 'company-name',
          }),
          createSkipOperation<TestFacts, TestRuntimeContext>({
            operationId: 'flow/skip',
            checkerId: 'flow-checker',
            skipId: 'flow.skip',
            run: skipRun,
          }),
          createStepOperation<TestFacts, TestRuntimeContext>({
            operationId: 'flow/application',
            checkerId: 'flow-checker',
            blockId: 'application-name',
          }),
        ],
        context: params.context,
        runtimeContext: params.runtimeContext,
      }),
    );

    const { result } = renderHook(() =>
      useWorkflowRuntime({
        facts: createFacts(),
        factsKey: 'acc_1:uid_1',
        runtimeContext: createRuntimeContext(),
        createInitialContext: createSharedContext,
        compilePlan,
      }),
    );

    await waitFor(() => {
      expect(result.current.activeBlock?.blockId).toBe('company-name');
      expect(result.current.canGoBack).toBe(false);
    });

    act(() => {
      result.current.advance();
    });

    await waitFor(() => {
      expect(skipRun).toHaveBeenCalledTimes(1);
      expect(result.current.activeBlock?.blockId).toBe('application-name');
      expect(result.current.resolvedRuntimeContext?.skipRuns).toBe(1);
      expect(result.current.canGoBack).toBe(true);
    });

    act(() => {
      result.current.goBack();
    });

    await waitFor(() => {
      expect(result.current.activeBlock?.blockId).toBe('company-name');
      expect(result.current.canGoBack).toBe(false);
    });
  });

  it('keeps canGoBack false when prior operations are only skips', async () => {
    const compilePlan = vi.fn(
      async (params: {
        runtimeContext: TestRuntimeContext;
        context: TestSharedContext;
      }) => ({
        operations: [
          createSkipOperation<TestFacts, TestRuntimeContext>({
            operationId: 'flow/skip-start',
            checkerId: 'flow-checker',
            skipId: 'flow.skip.start',
            run: async (skipParams) => skipParams.context,
          }),
          createStepOperation<TestFacts, TestRuntimeContext>({
            operationId: 'flow/dkim',
            checkerId: 'flow-checker',
            blockId: 'dkim',
          }),
        ],
        context: params.context,
        runtimeContext: params.runtimeContext,
      }),
    );

    const { result } = renderHook(() =>
      useWorkflowRuntime({
        facts: createFacts(),
        factsKey: 'acc_1:uid_1',
        runtimeContext: createRuntimeContext(),
        createInitialContext: createSharedContext,
        compilePlan,
      }),
    );

    await waitFor(() => {
      expect(result.current.activeBlock?.blockId).toBe('dkim');
      expect(result.current.canGoBack).toBe(false);
    });
  });

  it('patches runtime context and forwards patches to shared context mutator', async () => {
    const patchContext = vi.fn(
      (params: {
        context: TestSharedContext;
        patch: Partial<TestRuntimeContext>;
      }) => ({
        ...params.context,
        patchCount: params.context.patchCount + 1,
        lastPatchedApplicationId:
          params.patch.applicationId ?? params.context.lastPatchedApplicationId,
      }),
    );

    const compilePlan = vi.fn(
      async (params: {
        runtimeContext: TestRuntimeContext;
        context: TestSharedContext;
      }) => ({
        operations: createStepOperations(),
        context: params.context,
        runtimeContext: params.runtimeContext,
      }),
    );

    const { result } = renderHook(() =>
      useWorkflowRuntime({
        facts: createFacts(),
        factsKey: 'acc_1:uid_1',
        runtimeContext: createRuntimeContext(),
        createInitialContext: createSharedContext,
        compilePlan,
        patchContext,
      }),
    );

    await waitFor(() => {
      expect(result.current.hasCompiledPlan).toBe(true);
    });

    act(() => {
      result.current.applyRuntimeContextPatch({
        applicationId: 'app_99',
        patched: true,
      });
    });

    await waitFor(() => {
      expect(result.current.resolvedRuntimeContext?.applicationId).toBe(
        'app_99',
      );
      expect(result.current.resolvedRuntimeContext?.patched).toBe(true);
    });
    expect(patchContext).toHaveBeenCalledTimes(1);
  });

  it('captures compile failures and keeps compile stage as the failure source', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const compilePlan = vi.fn(async () => {
      throw new Error('Compile failed');
    });

    const { rerender, result } = renderHook(
      (props: { factsKey: string }) =>
        useWorkflowRuntime({
          facts: createFacts(),
          factsKey: props.factsKey,
          runtimeContext: createRuntimeContext(),
          createInitialContext: createSharedContext,
          compilePlan,
        }),
      {
        initialProps: { factsKey: 'acc_1:uid_1' },
      },
    );

    await waitFor(() => {
      expect(result.current.failure?.stage).toBe('compile');
      expect(result.current.failure?.operationId).toBeNull();
      expect(result.current.hasCompiledPlan).toBe(false);
    });

    expect(compilePlan).toHaveBeenCalledTimes(1);
    rerender({ factsKey: 'acc_1:uid_1' });
    expect(compilePlan).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  it('retries compile failures when retry is invoked', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const compilePlan = vi
      .fn()
      .mockImplementationOnce(async () => {
        throw new Error('Compile failed once');
      })
      .mockImplementation(
        async (params: {
          runtimeContext: TestRuntimeContext;
          context: TestSharedContext;
        }) => ({
          operations: createStepOperations(),
          context: params.context,
          runtimeContext: params.runtimeContext,
        }),
      );

    const { result } = renderHook(() =>
      useWorkflowRuntime({
        facts: createFacts(),
        factsKey: 'acc_1:uid_1',
        runtimeContext: createRuntimeContext(),
        createInitialContext: createSharedContext,
        compilePlan,
      }),
    );

    await waitFor(() => {
      expect(result.current.failure?.stage).toBe('compile');
    });
    expect(compilePlan).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.failure).toBeNull();
      expect(result.current.hasCompiledPlan).toBe(true);
      expect(result.current.operations).toHaveLength(2);
    });
    expect(compilePlan).toHaveBeenCalledTimes(2);
    consoleErrorSpy.mockRestore();
  });

  it('resets and recompiles for the same facts key when resetPlan is called', async () => {
    const compilePlan = vi.fn(
      async (params: {
        runtimeContext: TestRuntimeContext;
        context: TestSharedContext;
      }) => ({
        operations: createStepOperations(),
        context: params.context,
        runtimeContext: params.runtimeContext,
      }),
    );

    const { result } = renderHook(() =>
      useWorkflowRuntime({
        facts: createFacts(),
        factsKey: 'acc_1:uid_1',
        runtimeContext: createRuntimeContext(),
        createInitialContext: createSharedContext,
        compilePlan,
      }),
    );

    await waitFor(() => {
      expect(result.current.hasCompiledPlan).toBe(true);
    });
    expect(compilePlan).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setCursor(1);
      result.current.resetPlan();
    });

    await waitFor(() => {
      expect(result.current.hasCompiledPlan).toBe(true);
      expect(result.current.cursor).toBe(0);
      expect(result.current.operations).toHaveLength(2);
    });
    expect(compilePlan).toHaveBeenCalledTimes(2);
  });

  it('captures skip failures once and prevents infinite retry loops', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const skipRun = vi.fn(async () => {
      throw new Error('Skip failed');
    });
    const compilePlan = vi.fn(
      async (params: {
        runtimeContext: TestRuntimeContext;
        context: TestSharedContext;
      }) => ({
        operations: [
          createSkipOperation<TestFacts, TestRuntimeContext>({
            operationId: 'flow/failing-skip',
            checkerId: 'flow-checker',
            skipId: 'flow.failingSkip',
            run: skipRun,
          }),
        ],
        context: params.context,
        runtimeContext: params.runtimeContext,
      }),
    );

    const { result } = renderHook(() =>
      useWorkflowRuntime({
        facts: createFacts(),
        factsKey: 'acc_1:uid_1',
        runtimeContext: createRuntimeContext(),
        createInitialContext: createSharedContext,
        compilePlan,
      }),
    );

    await waitFor(() => {
      expect(result.current.failure?.stage).toBe('skip');
      expect(result.current.failure?.operationId).toBe('flow/failing-skip');
      expect(result.current.isExecutingSkip).toBe(false);
    });

    expect(skipRun).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.failure?.stage).toBe('skip');
      expect(skipRun).toHaveBeenCalledTimes(2);
    });
    consoleErrorSpy.mockRestore();
  });
});

describe('useProgressionWorkflow', () => {
  it('keeps phase as loading until compile resolves', async () => {
    let completeCompile:
      | ((value: {
          operations: WorkflowOperation<TestFacts, TestRuntimeContext>[];
          context: TestSharedContext;
          runtimeContext: TestRuntimeContext;
        }) => void)
      | null = null;
    const compilePlan = vi.fn(
      () =>
        new Promise<{
          operations: WorkflowOperation<TestFacts, TestRuntimeContext>[];
          context: TestSharedContext;
          runtimeContext: TestRuntimeContext;
        }>((resolve) => {
          completeCompile = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useProgressionWorkflow({
        facts: createFacts(),
        factsKey: 'acc_1:uid_1',
        runtimeContext: createRuntimeContext(),
        createInitialContext: createSharedContext,
        compilePlan,
        allowEmptyPlanComplete: true,
      }),
    );

    expect(result.current.phase.kind).toBe('loading');
    expect(result.current.progress).toBeNull();

    act(() => {
      completeCompile?.({
        operations: createStepOperations(),
        context: createSharedContext(),
        runtimeContext: createRuntimeContext(),
      });
    });

    await waitFor(() => {
      expect(result.current.phase.kind).toBe('step');
      expect(result.current.progress?.totalBlocks).toBe(2);
    });
  });

  it('fails fast with a recoverable error when compile yields zero steps', async () => {
    const compilePlan = vi.fn(
      async (params: {
        runtimeContext: TestRuntimeContext;
        context: TestSharedContext;
      }) => ({
        operations: [],
        context: params.context,
        runtimeContext: params.runtimeContext,
      }),
    );

    const { result } = renderHook(() =>
      useProgressionWorkflow({
        facts: createFacts(),
        factsKey: 'acc_1:uid_1',
        runtimeContext: createRuntimeContext(),
        createInitialContext: createSharedContext,
        compilePlan,
        emptyPlanMessage: 'No progression workflow steps were produced.',
      }),
    );

    await waitFor(() => {
      expect(result.current.phase).toEqual({
        kind: 'error',
        recoverable: true,
        message: 'No progression workflow steps were produced.',
      });
      expect(result.current.progress).toBeNull();
    });
  });

  it('allows explicit empty-plan completion when requested', async () => {
    const compilePlan = vi.fn(
      async (params: {
        runtimeContext: TestRuntimeContext;
        context: TestSharedContext;
      }) => ({
        operations: [],
        context: params.context,
        runtimeContext: params.runtimeContext,
      }),
    );

    const { result } = renderHook(() =>
      useProgressionWorkflow({
        facts: createFacts(),
        factsKey: 'acc_1:uid_1',
        runtimeContext: createRuntimeContext(),
        createInitialContext: createSharedContext,
        compilePlan,
        allowEmptyPlanComplete: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.phase.kind).toBe('complete');
      expect(result.current.progress).toBeNull();
    });
  });

  it('stays in loading phase while skip operations are executing', async () => {
    let resolveSkipContext: ((value: TestRuntimeContext) => void) | null = null;
    const compilePlan = vi.fn(
      async (params: {
        runtimeContext: TestRuntimeContext;
        context: TestSharedContext;
      }) => ({
        operations: [
          createStepOperation<TestFacts, TestRuntimeContext>({
            operationId: 'flow/company',
            checkerId: 'flow-checker',
            blockId: 'company-name',
          }),
          createSkipOperation<TestFacts, TestRuntimeContext>({
            operationId: 'flow/skip',
            checkerId: 'flow-checker',
            skipId: 'flow.skip',
            run: () =>
              new Promise<TestRuntimeContext>((resolve) => {
                resolveSkipContext = resolve;
              }),
          }),
          createStepOperation<TestFacts, TestRuntimeContext>({
            operationId: 'flow/application',
            checkerId: 'flow-checker',
            blockId: 'application-name',
          }),
        ],
        context: params.context,
        runtimeContext: params.runtimeContext,
      }),
    );

    const { result } = renderHook(() =>
      useProgressionWorkflow({
        facts: createFacts(),
        factsKey: 'acc_1:uid_1',
        runtimeContext: createRuntimeContext(),
        createInitialContext: createSharedContext,
        compilePlan,
        allowEmptyPlanComplete: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.phase).toEqual({
        kind: 'step',
        stepId: 'company-name',
      });
    });

    act(() => {
      result.current.controls.proceed();
    });

    await waitFor(() => {
      expect(result.current.phase.kind).toBe('loading');
    });

    act(() => {
      resolveSkipContext?.({
        ...createRuntimeContext(),
        skipRuns: 1,
      });
    });

    await waitFor(() => {
      expect(result.current.phase).toEqual({
        kind: 'step',
        stepId: 'application-name',
      });
    });
  });

  it('marks the progression workflow complete after advancing beyond the final step', async () => {
    const compilePlan = vi.fn(
      async (params: {
        runtimeContext: TestRuntimeContext;
        context: TestSharedContext;
      }) => ({
        operations: createStepOperations(),
        context: params.context,
        runtimeContext: params.runtimeContext,
      }),
    );

    const { result } = renderHook(() =>
      useProgressionWorkflow({
        facts: createFacts(),
        factsKey: 'acc_1:uid_1',
        runtimeContext: createRuntimeContext(),
        createInitialContext: createSharedContext,
        compilePlan,
        allowEmptyPlanComplete: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.phase).toEqual({
        kind: 'step',
        stepId: 'company-name',
      });
    });

    act(() => {
      result.current.controls.proceed();
    });

    await waitFor(() => {
      expect(result.current.phase).toEqual({
        kind: 'step',
        stepId: 'application-name',
      });
    });

    act(() => {
      result.current.controls.proceed();
    });

    await waitFor(() => {
      expect(result.current.phase.kind).toBe('complete');
      expect(result.current.progress).toBeNull();
    });
  });

  it('throws when the active progression step is missing from the fixed step list', () => {
    expect(() =>
      resolveProgressionWorkflowProgressSafe({
        phase: { kind: 'step', stepId: 'missing-step' },
        stepIds: ['company-name', 'application-name'],
      }),
    ).toThrow('Workflow step "missing-step" is not in the fixed plan');
  });
});
