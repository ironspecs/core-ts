/**
 * Owns the shared back button used by progression step components. The button
 * is presentation-only and never decides whether back navigation is available.
 */

import { ArrowLeft } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@core-ts/react';

export function ProgressionBackButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    'data-testid'?: string;
  },
) {
  const {
    children,
    className,
    type = 'button',
    'data-testid': dataTestId = 'progression-back-button',
    ...buttonProps
  } = props;

  return (
    <button
      data-testid={dataTestId}
      type={type}
      className={cn(
        'btn btn-ghost c-btn-min-h c-btn-min-w gap-2 px-3 shadow-none',
        'transition-transform duration-150 ease-out',
        'hover:bg-base-200/70 hover:-translate-y-0.5 hover:shadow-sm',
        'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'active:translate-y-0 active:scale-[0.98]',
        className,
      )}
      {...buttonProps}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}
