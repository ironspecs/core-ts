/**
 * Verifies workflow runtime machine cursor movement, previous-step resolution,
 * runtime context updates, and progress derivation.
 */

import { describe, expect, it } from 'vitest';
import { createStepOperation } from './workflow';
import {
  createWorkflowRuntimeMachine,
  resolveNextCursor,
  resolveWorkflowProgress,
  resolvePreviousStepCursor,
} from './workflow-runtime';

type TestFacts = {
  accountId: string;
};

type TestRuntimeContext = {
  applicationId: string | null;
};

describe('runtime machine', () => {
  it('resolves next cursor safely', () => {
    expect(resolveNextCursor({ cursor: 0, size: 0 })).toBe(0);
    expect(resolveNextCursor({ cursor: 0, size: 2 })).toBe(1);
    expect(resolveNextCursor({ cursor: 2, size: 2 })).toBe(2);
  });

  it('resolves previous step cursor while skipping skip operations', () => {
    const operations = [
      createStepOperation<TestFacts, TestRuntimeContext>({
        operationId: 'one',
        checkerId: 'checker',
        blockId: 'company-name',
      }),
      Object.assign(() => ({ applicationId: null }), {
        kind: 'skip' as const,
        operationId: 'skip',
        checkerId: 'checker',
        skipId: 'skip-id',
        requirements: [],
      }),
      createStepOperation<TestFacts, TestRuntimeContext>({
        operationId: 'two',
        checkerId: 'checker',
        blockId: 'application-name',
      }),
    ];
    expect(
      resolvePreviousStepCursor({
        cursor: 2,
        operations,
      }),
    ).toBe(0);
  });

  it('calculates progress from cursor and total', () => {
    expect(resolveWorkflowProgress({ cursor: 0, total: 0 })).toEqual({
      current: 0,
      total: 0,
    });
    expect(resolveWorkflowProgress({ cursor: 1, total: 3 })).toEqual({
      current: 2,
      total: 3,
    });
  });

  it('supports cursor changes and runtime context patches', () => {
    const operations = [
      createStepOperation<TestFacts, TestRuntimeContext>({
        operationId: 'one',
        checkerId: 'checker',
        blockId: 'company-name',
      }),
      createStepOperation<TestFacts, TestRuntimeContext>({
        operationId: 'two',
        checkerId: 'checker',
        blockId: 'application-name',
      }),
    ];
    const machine = createWorkflowRuntimeMachine({
      initialState: {
        facts: Object.freeze({ accountId: 'acc_1' }),
        operations,
        cursor: 0,
        runtimeContext: { applicationId: null },
      },
    });

    machine.advance();
    expect(machine.getState().cursor).toBe(1);
    machine.backToPreviousStep();
    expect(machine.getState().cursor).toBe(0);
    machine.patchRuntimeContext({ applicationId: 'app_1' });
    expect(machine.getState().runtimeContext.applicationId).toBe('app_1');
  });

  it('supports completion cursor sentinel for isComplete', () => {
    const operations = [
      createStepOperation<TestFacts, TestRuntimeContext>({
        operationId: 'one',
        checkerId: 'checker',
        blockId: 'company-name',
      }),
      createStepOperation<TestFacts, TestRuntimeContext>({
        operationId: 'two',
        checkerId: 'checker',
        blockId: 'application-name',
      }),
    ];
    const machine = createWorkflowRuntimeMachine({
      initialState: {
        facts: Object.freeze({ accountId: 'acc_1' }),
        operations,
        cursor: 0,
        runtimeContext: { applicationId: null },
      },
    });

    machine.advance();
    machine.advance();
    expect(machine.getState().cursor).toBe(2);
    expect(machine.isComplete()).toBe(true);

    machine.setCursor(99);
    expect(machine.getState().cursor).toBe(2);
  });
});
