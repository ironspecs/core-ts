/**
 * Verifies route-agnostic drawer state derivation from caller-proven selected
 * state and viewport state.
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { useDrawerController } from "./useDrawerController.js";

vi.mock("../hooks/useMediaQuery.js", () => ({
  useMediaQuery: vi.fn(),
}));

const mockUseMediaQuery = vi.mocked(useMediaQuery);

describe("useDrawerController", () => {
  it("opens the drawer when mobile and selected", () => {
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() =>
      useDrawerController({
        isSelected: true,
        onRequestBack: vi.fn(),
      }),
    );

    expect(result.current.isDrawerOpen).toBe(true);
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isSelected).toBe(true);
  });

  it("does not open the drawer when desktop and selected", () => {
    mockUseMediaQuery.mockReturnValue(true);

    const { result } = renderHook(() =>
      useDrawerController({
        isSelected: true,
        onRequestBack: vi.fn(),
      }),
    );

    expect(result.current.isDrawerOpen).toBe(false);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isSelected).toBe(true);
  });

  it("does not open the drawer when mobile and unselected", () => {
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() =>
      useDrawerController({
        isSelected: false,
        onRequestBack: vi.fn(),
      }),
    );

    expect(result.current.isDrawerOpen).toBe(false);
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isSelected).toBe(false);
  });

  it("returns the provided back callback", () => {
    mockUseMediaQuery.mockReturnValue(false);
    const onRequestBack = vi.fn();

    const { result } = renderHook(() =>
      useDrawerController({
        isSelected: true,
        onRequestBack,
      }),
    );

    result.current.onRequestBack();

    expect(onRequestBack).toHaveBeenCalledTimes(1);
  });

  it("forwards custom desktop query to useMediaQuery", () => {
    mockUseMediaQuery.mockReturnValue(true);

    renderHook(() =>
      useDrawerController({
        isSelected: true,
        onRequestBack: vi.fn(),
        desktopQuery: "(min-width: 1024px)",
      }),
    );

    expect(mockUseMediaQuery).toHaveBeenCalledWith("(min-width: 1024px)");
  });
});
