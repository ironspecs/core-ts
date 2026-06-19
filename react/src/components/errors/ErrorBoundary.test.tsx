import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";

import { ErrorBoundary, type ErrorBoundaryLabels } from "./ErrorBoundary.js";

const labels: ErrorBoundaryLabels = {
  title: "Something went wrong",
  subtitle: "Unexpected error",
  tryAgain: "Try again",
  goHome: "Go home",
  persistMessage: "Contact support if this persists.",
};

describe("ErrorBoundary", () => {
  afterEach(() => {
    spyOn(console, "error").mockRestore();
  });

  it("renders children when no error is present", () => {
    const boundary = new ErrorBoundary({
      children: "Child content",
      labels,
    });

    expect(boundary.render()).toBe("Child content");
  });

  it("returns the custom fallback when one is provided", () => {
    const boundary = new ErrorBoundary({
      children: "Child content",
      fallback: "Fallback content",
      labels,
    });

    boundary.state = { hasError: true, error: new Error("boom") };

    expect(boundary.render()).toBe("Fallback content");
  });

  it("renders the default fallback when an error is present", () => {
    const boundary = new ErrorBoundary({
      children: "Child content",
      labels,
    });

    boundary.state = { hasError: true, error: new Error("boom") };

    const element = boundary.render();

    expect(element).not.toBeNull();
  });

  it("reports errors through onError", () => {
    const consoleError = spyOn(console, "error").mockImplementation(() => {});
    const onError = mock(() => {});
    const boundary = new ErrorBoundary({
      children: "Child content",
      labels,
      onError,
    });
    const error = new Error("boom");
    const errorInfo = { componentStack: "\n at TestComponent" };

    boundary.componentDidCatch(error, errorInfo);

    expect(consoleError).toHaveBeenCalledWith(
      "ErrorBoundary caught an error:",
      error,
      errorInfo,
    );
    expect(onError).toHaveBeenCalledWith(error, errorInfo);
  });

  it("resets state when retry is invoked", () => {
    const boundary = new ErrorBoundary({
      children: "Child content",
      labels,
    });
    const setState = mock(() => {});

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
