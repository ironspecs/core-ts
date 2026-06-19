/**
 * Verifies the shared progression back button presentation and native button
 * prop forwarding contract.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProgressionBackButton } from './ProgressionBackButton';

describe('ProgressionBackButton', () => {
  it('renders the back arrow and label', () => {
    render(<ProgressionBackButton>Back</ProgressionBackButton>);

    const button = screen.getByRole('button', { name: 'Back' });
    expect(button).toHaveAttribute('data-testid', 'progression-back-button');
    expect(button.querySelector('svg')).toBeTruthy();
    expect(button.textContent).toContain('Back');
  });

  it('forwards native button props', () => {
    const handleClick = vi.fn();

    render(
      <ProgressionBackButton
        aria-label="Go back"
        data-testid="progression-back-button"
        onClick={handleClick}
      >
        Back
      </ProgressionBackButton>,
    );

    const button = screen.getByTestId('progression-back-button');
    expect(button).toHaveAttribute('aria-label', 'Go back');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('merges custom classes with the default button classes', () => {
    render(
      <ProgressionBackButton className="custom-back-button">
        Back
      </ProgressionBackButton>,
    );

    const button = screen.getByRole('button', { name: 'Back' });
    expect(button.className).toContain('btn-ghost');
    expect(button.className).toContain('custom-back-button');
  });

  it('defaults to button type and keeps the label nowrap', () => {
    render(<ProgressionBackButton>Back to setup</ProgressionBackButton>);

    const button = screen.getByRole('button', { name: 'Back to setup' });
    const label = screen.getByText('Back to setup');

    expect(button).toHaveAttribute('type', 'button');
    expect(label.className).toContain('whitespace-nowrap');
  });
});
