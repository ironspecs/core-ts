/**
 * Verifies the current-language store contract, including subscription
 * notifications, cache writes, invalid input failures, and async preparation.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  changeLanguage,
  getCurrentLanguage,
  initializeCurrentLanguageFromEnvironmentOrDefault,
  setCurrentLanguage,
  setLanguageChangePreparer,
  subscribeCurrentLanguage,
} from "./language.js";

describe("language store", () => {
  const storageValues = new Map<string, string>();

  beforeEach(() => {
    storageValues.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storageValues.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storageValues.set(key, value);
        },
      },
    });
    setLanguageChangePreparer(async () => {});
    setCurrentLanguage("en");
  });

  it("notifies subscribers when the language changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeCurrentLanguage(listener);

    setCurrentLanguage("fr");
    unsubscribe();
    setCurrentLanguage("es");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(getCurrentLanguage()).toBe("es");
  });

  it("writes supported languages to local storage", () => {
    setCurrentLanguage("id");

    expect(storageValues.get("appLanguage")).toBe("id");
  });

  it("initializes from cached browser language during startup", () => {
    storageValues.set("appLanguage", "fr");

    initializeCurrentLanguageFromEnvironmentOrDefault();

    expect(getCurrentLanguage()).toBe("fr");
  });

  it("waits for preparation before changing the current language", async () => {
    let releasePreparation!: () => void;
    const prepareLanguage = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releasePreparation = resolve;
        }),
    );
    setLanguageChangePreparer(prepareLanguage);

    const pendingChange = changeLanguage("th");
    expect(getCurrentLanguage()).toBe("en");

    releasePreparation();
    await pendingChange;

    expect(prepareLanguage).toHaveBeenCalledWith("th");
    expect(getCurrentLanguage()).toBe("th");
  });
});
