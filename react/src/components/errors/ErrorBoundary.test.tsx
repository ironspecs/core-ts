import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ErrorBoundary, type ErrorBoundaryLabels } from "./ErrorBoundary.js";

const labels: ErrorBoundaryLabels = {
  title: "Something went wrong",
  subtitle: "Unexpected error",
  tryAgain: "Try again",
  goHome: "Go home",
  persistMessage: "Contact support if this persists.",
};

function Thrower() {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children when no error is present", () => {
    render(<ErrorBoundary labels={labels}>Child content</ErrorBoundary>);

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("returns the custom fallback when one is provided", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Fallback content</div>} labels={labels}>
        <Thrower />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Fallback content")).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });

  it("renders the default fallback when an error is present", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary labels={labels}>
        <Thrower />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: labels.title })).toBeVisible();
    expect(screen.getByText(labels.subtitle)).toBeVisible();
    expect(screen.getByRole("button", { name: labels.tryAgain })).toBeVisible();
    expect(screen.getByRole("button", { name: labels.goHome })).toBeVisible();
  });

  it("reports errors through onError", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <ErrorBoundary labels={labels} onError={onError}>
        <Thrower />
      </ErrorBoundary>,
    );

    expect(consoleError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0]?.[0].message).toBe("boom");
  });

  it("resets state when retry is invoked", () => {
    const boundary = new ErrorBoundary({
      children: "Child content",
      labels,
    });
    const setState = vi.fn();

    boundary.setState = setState as typeof boundary.setState;
    boundary.handleRetry();

    expect(setState).toHaveBeenCalledWith({ hasError: false, error: null });
  });

  it("captures the thrown error in derived state", () => {
    const error = new Error("boom");

    expect(ErrorBoundary.getDerivedStateFromError(error)).toEqual({
      hasError: true,
      error,
    });
  });
});
