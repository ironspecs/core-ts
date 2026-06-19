/**
 * Verifies generic workflow log derivation and validation of included entries.
 */

import { describe, expect, it } from 'vitest';
import { deriveWorkflowLogEntries } from './workflow-log';

type RuntimeContext = {
  accountName: string | null;
  applicationName: string | null;
  hasPublicClient: boolean;
};

describe('deriveWorkflowLogEntries', () => {
  it('derives setup log entries in rule order', () => {
    const entries = deriveWorkflowLogEntries({
      context: {
        accountName: 'Jsonlog LLC',
        applicationName: 'Inbox Manager',
        hasPublicClient: true,
      } satisfies RuntimeContext,
      rules: [
        {
          labelKey: 'companyName',
          shouldInclude: (context) => Boolean(context.accountName),
          resolveValue: (context) => context.accountName,
        },
        {
          labelKey: 'applicationName',
          shouldInclude: (context) => Boolean(context.applicationName),
          resolveValue: (context) => context.applicationName,
        },
        {
          labelKey: 'publicClient',
          shouldInclude: (context) => context.hasPublicClient,
          resolveValue: () => null,
          valueKey: 'created',
        },
      ],
    });

    expect(entries).toEqual([
      { labelKey: 'companyName', value: 'Jsonlog LLC' },
      { labelKey: 'applicationName', value: 'Inbox Manager' },
      { labelKey: 'publicClient', value: null, valueKey: 'created' },
    ]);
  });

  it('fails fast when entry requires value but none is resolved', () => {
    expect(() =>
      deriveWorkflowLogEntries({
        context: {
          accountName: null,
          applicationName: 'Inbox Manager',
          hasPublicClient: false,
        } satisfies RuntimeContext,
        rules: [
          {
            labelKey: 'applicationName',
            shouldInclude: () => true,
            resolveValue: () => null,
          },
        ],
      }),
    ).toThrow('requires a value or valueKey');
  });
});
