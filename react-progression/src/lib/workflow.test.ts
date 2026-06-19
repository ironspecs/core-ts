/**
 * Verifies pure workflow plan helpers, including operation creation, plan
 * immutability, renderable operation filtering, and duplicate id failures.
 */

import { describe, expect, it } from 'vitest';
import type { WorkflowChecker } from '../types/workflow';
import {
  clampWorkflowCursor,
  compileWorkflowPlan,
  createSkipOperation,
  createStepOperation,
  listRenderableWorkflowOps,
  listSkippableWorkflowOps,
} from './workflow';

type TestFacts = {
  accountId: string;
  userId: string;
};

type TestRuntimeContext = {
  accountName: string | null;
  applicationId: string | null;
};

type TestSharedContext = {
  accountId: string;
  applicationId: string | null;
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
    accountName: null,
    applicationId: null,
    ...overrides,
  };
}

function createSharedContext(
  overrides: Partial<TestSharedContext> = {},
): TestSharedContext {
  return {
    accountId: 'acc_1',
    applicationId: null,
    ...overrides,
  };
}

describe('workflow planner', () => {
  it('builds immutable flattened operation plan from participating handlers', async () => {
    const handlers: WorkflowChecker<
      TestFacts,
      TestRuntimeContext,
      string,
      'company-name' | 'application-name'
    >[] = [
      {
        id: 'disabled-handler',
        shouldHandle: () => false,
        createOperations: () => [
          createStepOperation({
            operationId: 'disabled/step',
            checkerId: 'disabled-handler',
            blockId: 'company-name',
          }),
        ],
      },
      {
        id: 'enabled-handler',
        shouldHandle: () => true,
        createOperations: (_facts, context) => {
          context.accountName = 'Acme';
          return [
            createStepOperation({
              operationId: 'enabled/step',
              checkerId: 'enabled-handler',
              blockId: 'application-name',
            }),
            createSkipOperation({
              operationId: 'enabled/skip',
              checkerId: 'enabled-handler',
              skipId: 'enabled.skip',
            }),
          ];
        },
      },
    ];

    const plan = await compileWorkflowPlan({
      facts: createFacts(),
      runtimeContext: createRuntimeContext(),
      context: createSharedContext(),
      checkers: handlers,
      applyContext: ({ context, runtimeContext }) => ({
        ...context,
        applicationId: runtimeContext.applicationId,
      }),
    });

    expect(plan.operations).toHaveLength(2);
    expect(plan.operations[0]?.operationId).toBe('enabled/step');
    expect(plan.operations[1]?.kind).toBe('skip');
    expect(Object.isFrozen(plan.operations)).toBe(true);
    expect(plan.runtimeContext.accountName).toBe('Acme');
  });

  it('freezes entry facts before evaluating handlers', async () => {
    const mutatingHandler: WorkflowChecker<TestFacts, TestRuntimeContext> = {
      id: 'mutating-handler',
      shouldHandle: () => true,
      createOperations: (facts) => {
        (facts as TestFacts).accountId = 'acc_mutated';
        return [
          createSkipOperation({
            operationId: 'mutating/skip',
            checkerId: 'mutating-handler',
            skipId: 'mutating-handler.skip',
          }),
        ];
      },
    };

    await expect(
      compileWorkflowPlan({
        facts: createFacts(),
        runtimeContext: createRuntimeContext(),
        context: createSharedContext(),
        checkers: [mutatingHandler],
      }),
    ).rejects.toBeInstanceOf(TypeError);
  });

  it('fails fast when operation ids are duplicated', async () => {
    const duplicateOperationHandlers: WorkflowChecker<
      TestFacts,
      TestRuntimeContext,
      string,
      'company-name' | 'application-name'
    >[] = [
      {
        id: 'first',
        shouldHandle: () => true,
        createOperations: () => [
          createStepOperation({
            operationId: 'duplicate/operation',
            checkerId: 'first',
            blockId: 'company-name',
          }),
        ],
      },
      {
        id: 'second',
        shouldHandle: () => true,
        createOperations: () => [
          createStepOperation({
            operationId: 'duplicate/operation',
            checkerId: 'second',
            blockId: 'application-name',
          }),
        ],
      },
    ];

    await expect(
      compileWorkflowPlan({
        facts: createFacts(),
        runtimeContext: createRuntimeContext(),
        context: createSharedContext(),
        checkers: duplicateOperationHandlers,
      }),
    ).rejects.toThrow('Duplicate workflow operation id');
  });

  it('lists step and skip operations safely', async () => {
    const plan = await compileWorkflowPlan({
      facts: createFacts(),
      runtimeContext: createRuntimeContext(),
      context: createSharedContext(),
      checkers: [
        {
          id: 'mixed-handler',
          shouldHandle: () => true,
          createOperations: () => [
            createStepOperation<TestFacts, TestRuntimeContext>({
              operationId: 'mixed/company',
              checkerId: 'mixed-handler',
              blockId: 'company-name',
            }),
            createSkipOperation<TestFacts, TestRuntimeContext>({
              operationId: 'mixed/skip',
              checkerId: 'mixed-handler',
              skipId: 'mixed-handler.skip',
            }),
            createStepOperation<TestFacts, TestRuntimeContext>({
              operationId: 'mixed/app',
              checkerId: 'mixed-handler',
              blockId: 'application-name',
            }),
          ],
        },
      ],
    });

    const renderable = listRenderableWorkflowOps(plan.operations);
    const skippable = listSkippableWorkflowOps(plan.operations);

    expect(renderable.map((operation) => operation.blockId)).toEqual([
      'company-name',
      'application-name',
    ]);
    expect(skippable.map((operation) => operation.skipId)).toEqual([
      'mixed-handler.skip',
    ]);
  });

  it('clamps cursor safely', () => {
    expect(clampWorkflowCursor({ cursor: -1, size: 5 })).toBe(0);
    expect(clampWorkflowCursor({ cursor: 9, size: 5 })).toBe(4);
    expect(clampWorkflowCursor({ cursor: 2, size: 5 })).toBe(2);
    expect(clampWorkflowCursor({ cursor: 2, size: 0 })).toBe(0);
  });
});
