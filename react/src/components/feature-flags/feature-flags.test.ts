import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type FeatureFlags,
  resetFeatureFlagsAndReload,
  resolveFeatureFlags,
  setFeatureFlagsAndReload,
} from "./feature-flags.js";

const sessionStorageValues = new Map<string, string>();
let reloadLocation: ReturnType<typeof vi.fn>;

beforeEach(() => {
  sessionStorageValues.clear();
  reloadLocation = vi.fn();
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      cookie: "",
    },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: {
        href: "http://localhost/",
        reload: reloadLocation,
      },
    },
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => sessionStorageValues.get(key),
      setItem: (key: string, value: string) =>
        sessionStorageValues.set(key, value),
      removeItem: (key: string) => sessionStorageValues.delete(key),
    },
  });
});

afterEach(() => {
  sessionStorageValues.clear();
  vi.restoreAllMocks();
});

describe("feature-flags", () => {
  it("sets feature flags in a cookie and reloads the page", () => {
    const flags: FeatureFlags = { featureA: "enabled", featureB: "beta" };

    setFeatureFlagsAndReload(flags);

    expect(document.cookie).toBe(
      "ff=%7B%22featureA%22%3A%22enabled%22%2C%22featureB%22%3A%22beta%22%7D; path=/",
    );
    expect(reloadLocation).toHaveBeenCalled();
  });

  it("resolves feature flags from query parameters and updates the cookie", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          href: "http://localhost/?ff=featureA:enabled,featureB:beta",
          reload: vi.fn(),
        },
      },
    });

    const flags = resolveFeatureFlags();

    expect(flags).toEqual({ featureA: "enabled", featureB: "beta" });
    expect(document.cookie).toBe(
      "ff=%7B%22featureA%22%3A%22enabled%22%2C%22featureB%22%3A%22beta%22%7D; path=/",
    );
  });

  it("removes flags when query parameter values are empty", () => {
    document.cookie = 'ff={"featureA":"enabled","featureB":"beta"}';
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          href: "http://localhost/?ff=featureB:",
          reload: vi.fn(),
        },
      },
    });

    const flags = resolveFeatureFlags();

    expect(flags).toEqual({ featureA: "enabled" });
    expect(document.cookie).toBe(
      "ff=%7B%22featureA%22%3A%22enabled%22%7D; path=/",
    );
  });

  it("clears feature flags and reloads the page", () => {
    resetFeatureFlagsAndReload();

    expect(document.cookie).toBe(
      "ff=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT",
    );
    expect(reloadLocation).toHaveBeenCalled();
  });

  it("prevents infinite reload loops with a guard", () => {
    sessionStorageValues.set("ffReloadGuard", "true");

    resetFeatureFlagsAndReload();

    expect(reloadLocation).not.toHaveBeenCalled();
    expect(sessionStorageValues.get("ffReloadGuard")).toBeUndefined();
  });

  it("throws an error and clears flags if the cookie contains invalid JSON", () => {
    document.cookie = "ff=invalid_json";

    expect(() => resolveFeatureFlags()).toThrow(
      "Failed to parse feature flags cookie",
    );
    expect(document.cookie).toBe(
      "ff=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT",
    );
    expect(reloadLocation).toHaveBeenCalled();
  });

  it("does nothing if no query parameter or cookie is present", () => {
    const flags = resolveFeatureFlags();

    expect(flags).toEqual({});
  });
});
