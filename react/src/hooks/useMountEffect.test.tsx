import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMountEffect } from "./useMountEffect.js";

describe("useMountEffect", () => {
  it("runs the effect once on mount", () => {
    const effect = vi.fn();

    renderHook(() => useMountEffect(effect));

    expect(effect).toHaveBeenCalledTimes(1);
  });

  it("runs cleanup on unmount", () => {
    const cleanup = vi.fn();

    const { unmount } = renderHook(() => useMountEffect(() => cleanup));

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
