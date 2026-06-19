/**
 * Verifies the Progression render shell contract: immutable snapshots, explicit
 * context patches, navigation behavior, and completion/cancellation callbacks.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Progression } from './Progression';
import type {
  ProgressionStepComponent,
  ProgressionStepProps,
} from '../types/progression';

const TEST_LABELS = {
  cancel: 'Cancel',
  loading: 'Loading',
  errorTitle: 'Error',
  errorDescription: 'Error description',
};

describe('Progression', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gives steps a frozen facts snapshot so mutations fail locally and do not leak', () => {
    const onFactMutationError = vi.fn();

    function FactsStep(
      props: ProgressionStepProps<
        'facts' | 'review',
        {
          account: {
            name: string;
          };
          flags: string[];
        },
        {
          applicationId: string | null;
        }
      >,
    ) {
      return (
        <button
          type="button"
          onClick={() => {
            try {
              Object.assign(props.facts.account, { name: 'Mutated' });
            } catch (error) {
              onFactMutationError(error);
            }

            props.onProceed({ advance: 'review' });
          }}
        >
          Continue
        </button>
      );
    }

    function ReviewStep(
      props: ProgressionStepProps<
        'facts' | 'review',
        {
          account: {
            name: string;
          };
          flags: string[];
        },
        {
          applicationId: string | null;
        }
      >,
    ) {
      return (
        <div>
          {props.facts.account.name}:{props.facts.flags.join(',')}
        </div>
      );
    }

    const stepMap: Record<
      'facts' | 'review',
      ProgressionStepComponent<
        'facts' | 'review',
        {
          account: {
            name: string;
          };
          flags: string[];
        },
        {
          applicationId: string | null;
        }
      >
    > = {
      facts: FactsStep,
      review: ReviewStep,
    };

    render(
      <Progression
        steps={['facts', 'review']}
        facts={{
          account: { name: 'Acme' },
          flags: ['alpha'],
        }}
        initialContext={{ applicationId: null }}
        labels={TEST_LABELS}
        stepMap={stepMap}
        onComplete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onFactMutationError).toHaveBeenCalledTimes(1);
    expect(onFactMutationError.mock.calls[0][0]).toBeInstanceOf(TypeError);
    expect(screen.getByText('Acme:alpha')).toBeInTheDocument();
  });

  it('treats facts as immutable setup input and ignores later facts prop changes', () => {
    function FactsStep(
      props: ProgressionStepProps<
        'facts' | 'review',
        {
          account: {
            name: string;
          };
        },
        {
          applicationId: string | null;
        }
      >,
    ) {
      return (
        <button
          type="button"
          onClick={() => {
            props.onProceed({ advance: 'review' });
          }}
        >
          Continue
        </button>
      );
    }

    function ReviewStep(
      props: ProgressionStepProps<
        'facts' | 'review',
        {
          account: {
            name: string;
          };
        },
        {
          applicationId: string | null;
        }
      >,
    ) {
      return <div>{props.facts.account.name}</div>;
    }

    const stepMap: Record<
      'facts' | 'review',
      ProgressionStepComponent<
        'facts' | 'review',
        {
          account: {
            name: string;
          };
        },
        {
          applicationId: string | null;
        }
      >
    > = {
      facts: FactsStep,
      review: ReviewStep,
    };

    const { rerender } = render(
      <Progression
        steps={['facts', 'review']}
        facts={{
          account: { name: 'Acme' },
        }}
        initialContext={{ applicationId: null }}
        labels={TEST_LABELS}
        stepMap={stepMap}
        onComplete={vi.fn()}
      />,
    );

    rerender(
      <Progression
        steps={['facts', 'review']}
        facts={{
          account: { name: 'Changed later' },
        }}
        initialContext={{ applicationId: null }}
        labels={TEST_LABELS}
        stepMap={stepMap}
        onComplete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.queryByText('Changed later')).not.toBeInTheDocument();
  });

  it('gives each step a frozen context snapshot and only persists runtimePatch changes', () => {
    const onContextMutationError = vi.fn();

    function ContextStep(
      props: ProgressionStepProps<
        'context' | 'review',
        {
          accountId: string;
        },
        {
          value: string;
          nested: {
            count: number;
          };
        }
      >,
    ) {
      return (
        <button
          type="button"
          onClick={() => {
            try {
              Object.assign(props.context.nested, { count: 99 });
            } catch (error) {
              onContextMutationError(error);
            }

            props.onProceed({
              runtimePatch: {
                value: 'patched',
                nested: { count: 1 },
              },
              advance: 'review',
            });
          }}
        >
          Patch Context
        </button>
      );
    }

    function ReviewStep(
      props: ProgressionStepProps<
        'context' | 'review',
        {
          accountId: string;
        },
        {
          value: string;
          nested: {
            count: number;
          };
        }
      >,
    ) {
      return (
        <div>
          {props.context.value}:{props.context.nested.count}
        </div>
      );
    }

    const stepMap: Record<
      'context' | 'review',
      ProgressionStepComponent<
        'context' | 'review',
        {
          accountId: string;
        },
        {
          value: string;
          nested: {
            count: number;
          };
        }
      >
    > = {
      context: ContextStep,
      review: ReviewStep,
    };

    render(
      <Progression
        steps={['context', 'review']}
        facts={{ accountId: 'acc_1' }}
        initialContext={{ value: 'initial', nested: { count: 0 } }}
        labels={TEST_LABELS}
        stepMap={stepMap}
        onComplete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Patch Context' }));

    expect(onContextMutationError).toHaveBeenCalledTimes(1);
    expect(onContextMutationError.mock.calls[0][0]).toBeInstanceOf(TypeError);
    expect(screen.getByText('patched:1')).toBeInTheDocument();
  });

  it('shows the shared loading UI when the active step suspends', () => {
    const loadingPromise = new Promise<never>(() => {});

    function LoadingStep(
      _props: ProgressionStepProps<
        'loading',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >,
    ): React.JSX.Element {
      throw loadingPromise;
    }

    const stepMap: Record<
      'loading',
      ProgressionStepComponent<
        'loading',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >
    > = {
      loading: LoadingStep,
    };

    render(
      <Progression
        steps={['loading']}
        facts={{ accountId: 'acc_1' }}
        initialContext={{ applicationId: null }}
        labels={TEST_LABELS}
        stepMap={stepMap}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByText(TEST_LABELS.loading)).toHaveClass('sr-only');
    expect(
      document.querySelector('.loading.loading-spinner.loading-lg'),
    ).not.toBeNull();
  });

  it('shows the shared error body when the active step throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    function ErrorStep(
      _props: ProgressionStepProps<
        'error',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >,
    ): React.JSX.Element {
      throw new Error('boom');
    }

    const stepMap: Record<
      'error',
      ProgressionStepComponent<
        'error',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >
    > = {
      error: ErrorStep,
    };

    render(
      <Progression
        steps={['error']}
        facts={{ accountId: 'acc_1' }}
        initialContext={{ applicationId: null }}
        labels={TEST_LABELS}
        stepMap={stepMap}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByText(TEST_LABELS.errorTitle)).toBeInTheDocument();
    expect(screen.getByText(TEST_LABELS.errorDescription)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Cancel' }),
    ).not.toBeInTheDocument();
  });

  it('shows the shared error body when the active step map entry is missing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <Progression
        steps={['missing']}
        facts={{ accountId: 'acc_1' }}
        initialContext={{ applicationId: null }}
        labels={TEST_LABELS}
        stepMap={
          {} as Record<
            'missing',
            ProgressionStepComponent<
              'missing',
              {
                accountId: string;
              },
              {
                applicationId: string | null;
              }
            >
          >
        }
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByText(TEST_LABELS.errorTitle)).toBeInTheDocument();
    expect(screen.getByText(TEST_LABELS.errorDescription)).toBeInTheDocument();
  });

  it('shows an error cancel action and passes the current context', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    function StartStep(
      props: ProgressionStepProps<
        'start' | 'error',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >,
    ) {
      return (
        <button
          type="button"
          onClick={() => {
            props.onProceed({
              runtimePatch: { applicationId: 'app_123' },
              advance: 'error',
            });
          }}
        >
          Continue
        </button>
      );
    }

    function ErrorStep(
      _props: ProgressionStepProps<
        'start' | 'error',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >,
    ): React.JSX.Element {
      throw new Error('boom');
    }

    const onCancel = vi.fn();
    const stepMap: Record<
      'start' | 'error',
      ProgressionStepComponent<
        'start' | 'error',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >
    > = {
      start: StartStep,
      error: ErrorStep,
    };

    render(
      <Progression
        steps={['start', 'error']}
        facts={{ accountId: 'acc_1' }}
        initialContext={{ applicationId: null }}
        labels={TEST_LABELS}
        stepMap={stepMap}
        onComplete={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledWith({
      applicationId: 'app_123',
    });
  });

  it('delivers the patched context to onComplete', async () => {
    function CompleteStep(
      props: ProgressionStepProps<
        'complete',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >,
    ) {
      return (
        <button
          type="button"
          onClick={() => {
            props.onProceed({
              runtimePatch: { applicationId: 'app_123' },
              advance: true,
            });
          }}
        >
          Complete
        </button>
      );
    }

    const onComplete = vi.fn();
    const stepMap: Record<
      'complete',
      ProgressionStepComponent<
        'complete',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >
    > = {
      complete: CompleteStep,
    };

    render(
      <Progression
        steps={['complete']}
        facts={{ accountId: 'acc_1' }}
        initialContext={{ applicationId: null }}
        labels={TEST_LABELS}
        stepMap={stepMap}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith({ applicationId: 'app_123' });
    });
  });

  it('delivers the patched context to onCancel', async () => {
    function CancelStep(
      props: ProgressionStepProps<
        'cancel',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >,
    ) {
      return (
        <button
          type="button"
          onClick={() => {
            props.onBack?.({
              runtimePatch: { applicationId: 'app_cancelled' },
              goBack: true,
            });
          }}
        >
          Cancel
        </button>
      );
    }

    const onCancel = vi.fn();
    const stepMap: Record<
      'cancel',
      ProgressionStepComponent<
        'cancel',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >
    > = {
      cancel: CancelStep,
    };

    render(
      <Progression
        steps={['cancel']}
        facts={{ accountId: 'acc_1' }}
        initialContext={{ applicationId: null }}
        labels={TEST_LABELS}
        stepMap={stepMap}
        onComplete={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(onCancel).toHaveBeenCalledWith({
        applicationId: 'app_cancelled',
      });
    });
  });

  it('fails fast when steps is empty', () => {
    function OnlyStep(
      _props: ProgressionStepProps<
        'only',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >,
    ) {
      return <div>Only</div>;
    }

    vi.spyOn(console, 'error').mockImplementation(() => {
      return undefined;
    });
    const stepMap: Record<
      'only',
      ProgressionStepComponent<
        'only',
        {
          accountId: string;
        },
        {
          applicationId: string | null;
        }
      >
    > = {
      only: OnlyStep,
    };

    expect(() =>
      render(
        <Progression
          steps={[] as 'only'[]}
          facts={{ accountId: 'acc_1' }}
          initialContext={{ applicationId: null }}
          labels={TEST_LABELS}
          stepMap={stepMap}
          onComplete={vi.fn()}
        />,
      ),
    ).toThrow('Progression must have at least one step');
  });
});
