/**
 * Verifies submit transaction state transitions and duplicate-run protection.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSubmitAction } from "./useSubmitAction.js";

describe("useSubmitAction", () => {
  it("stays busy until action resolves and then transitions to success", async () => {
    let resolveAction: (() => void) | null = null;
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const { result } = renderHook(() => useSubmitAction({ action }));
    let secondRunResult: "started" | "skipped" | null = null;
    let completedRunResult: "started" | "skipped" | null = null;

    act(() => {
      void result.current.runIfIdle();
    });

    await act(async () => {
      secondRunResult = await result.current.runIfIdle();
    });

    await waitFor(() => {
      expect(result.current.buttonState).toBe("busy");
      expect(action).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      resolveAction?.();
    });

    await waitFor(() => {
      expect(result.current.buttonState).toBe("success");
    });

    await act(async () => {
      completedRunResult = await result.current.runIfIdle();
    });

    await waitFor(() => {
      expect(action).toHaveBeenCalledTimes(1);
    });
    expect(secondRunResult).toBe("skipped");
    expect(completedRunResult).toBe("skipped");
  });

  it("returns to idle and surfaces error when action rejects", async () => {
    const action = vi.fn(async () => {
      throw new Error("failed");
    });
    const { result } = renderHook(() => useSubmitAction({ action }));

    await act(async () => {
      await result.current.runIfIdle();
    });

    await waitFor(() => {
      expect(result.current.buttonState).toBe("idle");
      expect(result.current.error).toBe("failed");
    });
  });
});
