/**
 * Verifies stable workflow facts-key encoding and fail-fast behavior for values
 * that cannot produce deterministic keys.
 */

import { describe, expect, it } from 'vitest';
import { deriveWorkflowFactsKey } from './workflow-key';

describe('deriveWorkflowFactsKey', () => {
  it('produces stable keys independent of object property order', () => {
    const firstKey = deriveWorkflowFactsKey({
      accountId: 'acc_1',
      userId: 'uid_1',
      nested: {
        b: 'two',
        a: 'one',
      },
    });
    const secondKey = deriveWorkflowFactsKey({
      nested: {
        a: 'one',
        b: 'two',
      },
      userId: 'uid_1',
      accountId: 'acc_1',
    });

    expect(firstKey).toBe(secondKey);
  });

  it('treats missing keys and undefined keys as different inputs', () => {
    const missingKey = deriveWorkflowFactsKey({
      accountId: 'acc_1',
    });
    const undefinedKey = deriveWorkflowFactsKey({
      accountId: 'acc_1',
      userId: undefined,
    });

    expect(missingKey).not.toBe(undefinedKey);
  });

  it('supports nested arrays and primitive values', () => {
    const key = deriveWorkflowFactsKey({
      accountId: 'acc_1',
      flags: [true, false, null, 3],
      nested: [{ id: 'one' }, { id: 'two' }],
    });

    expect(key).toContain('accountId');
    expect(key).toContain('flags');
    expect(key).toContain('nested');
  });

  it('fails fast for unsupported values', () => {
    expect(() =>
      deriveWorkflowFactsKey({
        accountId: 'acc_1',
        onProceed: () => {},
      }),
    ).toThrow('Unsupported facts key value');
  });

  it('fails fast for non-finite numbers', () => {
    expect(() =>
      deriveWorkflowFactsKey({
        accountId: 'acc_1',
        count: Number.POSITIVE_INFINITY,
      }),
    ).toThrow('non-finite number');
  });
});
