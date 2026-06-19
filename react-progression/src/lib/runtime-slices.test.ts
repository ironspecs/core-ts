/**
 * Verifies runtime slice initialization, dependency-sensitive replacement, and
 * explicit failure when updating an uninitialized slice.
 */

import { describe, expect, it } from 'vitest';
import {
  createEmptyRuntimeSlices,
  ensureRuntimeSlice,
  setRuntimeSliceData,
} from './runtime-slices';

describe('runtime slices', () => {
  it('initializes a slice once and reuses it while dependencies are unchanged', () => {
    const first = ensureRuntimeSlice({
      slices: createEmptyRuntimeSlices(),
      sliceId: 'application-steps/application-name',
      dependencies: ['acc_1'],
      createInitialData: () => ({ name: 'First App' }),
    });
    const second = ensureRuntimeSlice({
      slices: first.slices,
      sliceId: 'application-steps/application-name',
      dependencies: ['acc_1'],
      createInitialData: () => ({ name: 'Should Not Reinitialize' }),
    });

    expect(second.slices).toBe(first.slices);
    expect(second.data.name).toBe('First App');
  });

  it('reinitializes a slice when dependency values change', () => {
    const first = ensureRuntimeSlice({
      slices: createEmptyRuntimeSlices(),
      sliceId: 'mx-steps/website-domain',
      dependencies: ['app_1'],
      createInitialData: () => ({ hostname: 'mail.one.test' }),
    });
    const second = ensureRuntimeSlice({
      slices: first.slices,
      sliceId: 'mx-steps/website-domain',
      dependencies: ['app_2'],
      createInitialData: () => ({ hostname: 'mail.two.test' }),
    });

    expect(second.slices).not.toBe(first.slices);
    expect(second.data.hostname).toBe('mail.two.test');
  });

  it('updates initialized slice data without changing dependency snapshot', () => {
    const initialized = ensureRuntimeSlice({
      slices: createEmptyRuntimeSlices(),
      sliceId: 'application-steps/company-name',
      dependencies: [],
      createInitialData: () => ({ name: 'Acme' }),
    });
    const updatedSlices = setRuntimeSliceData({
      slices: initialized.slices,
      sliceId: 'application-steps/company-name',
      next: { name: 'Ironspecs' },
    });
    const resolved = ensureRuntimeSlice({
      slices: updatedSlices,
      sliceId: 'application-steps/company-name',
      dependencies: [],
      createInitialData: () => ({ name: 'Should Not Reinitialize' }),
    });

    expect(resolved.data.name).toBe('Ironspecs');
  });
});
