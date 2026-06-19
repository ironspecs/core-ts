import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMediaQuery } from "./useMediaQuery.js";

type MatchMediaChangeListener = (event: MediaQueryListEvent) => void;

type MatchMediaController = {
  dispatch(nextMatches: boolean): void;
  mediaQueryList: MediaQueryList;
};

function createMatchMediaController(input: {
  initialMatches: boolean;
  query: string;
}): MatchMediaController {
  let matches = input.initialMatches;
  const listeners = new Set<MatchMediaChangeListener>();

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: input.query,
    onchange: null,
    addEventListener: (
      eventName: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      if (eventName !== "change" || typeof listener !== "function") {
        return;
      }

      listeners.add(listener as MatchMediaChangeListener);
    },
    removeEventListener: (
      eventName: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      if (eventName !== "change" || typeof listener !== "function") {
        return;
      }

      listeners.delete(listener as MatchMediaChangeListener);
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as MediaQueryList;

  return {
    dispatch(nextMatches: boolean) {
      matches = nextMatches;
      const event = {
        matches: nextMatches,
        media: input.query,
      } as MediaQueryListEvent;

      for (const listener of listeners) {
        listener(event);
      }
    },
    mediaQueryList,
  };
}

describe("useMediaQuery", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false during server rendering", () => {
    function TestComponent() {
      return useMediaQuery("(min-width: 768px)") ? "true" : "false";
    }

    expect(renderToString(<TestComponent />)).toBe("false");
  });

  it("returns the current matchMedia value", () => {
    const controller = createMatchMediaController({
      initialMatches: true,
      query: "(min-width: 768px)",
    });

    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => controller.mediaQueryList),
    });

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(result.current).toBe(true);
  });

  it("updates when the media query match changes", () => {
    const controller = createMatchMediaController({
      initialMatches: false,
      query: "(min-width: 768px)",
    });

    vi.stubGlobal("window", {
      matchMedia: vi.fn(() => controller.mediaQueryList),
    });

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

    expect(result.current).toBe(false);

    act(() => {
      controller.dispatch(true);
    });

    expect(result.current).toBe(true);
  });
});
