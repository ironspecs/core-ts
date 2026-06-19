/**
 * Verifies app-scoped i18next binding behavior, especially lazy resource
 * loading and delayed language-store updates during async language changes.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppI18n } from "./app-i18n.js";
import {
  changeLanguage,
  getCurrentLanguage,
  setCurrentLanguage,
} from "./language.js";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, reject, resolve };
}

describe("createAppI18n", () => {
  afterEach(() => {
    setCurrentLanguage("en");
  });

  it("loads only the requested language resources", async () => {
    const enStartup = vi.fn(async () => ({
      startup_splash_title: "Hello",
    }));
    const enPage = vi.fn(async () => ({
      greeting: "Welcome",
    }));
    const frStartup = vi.fn(async () => ({
      startup_splash_title: "Bonjour",
    }));
    const frPage = vi.fn(async () => ({
      greeting: "Salut",
    }));

    const appI18n = createAppI18n({
      app: "test.app",
      defaultNamespace: "startup",
      modules: {
        "../i18n/en/startup.json": enStartup,
        "../i18n/en/page.json": enPage,
        "../i18n/fr/startup.json": frStartup,
        "../i18n/fr/page.json": frPage,
      },
    });

    await appI18n.ensureLanguageReady("en");

    expect(enStartup).toHaveBeenCalledTimes(1);
    expect(enPage).toHaveBeenCalledTimes(1);
    expect(frStartup).not.toHaveBeenCalled();
    expect(frPage).not.toHaveBeenCalled();

    const startupTranslator = appI18n.getLabelTranslator({
      language: "en",
      namespace: "startup",
    });
    const pageTranslator = appI18n.getLabelTranslator({
      language: "en",
      namespace: "page",
    });

    expect(startupTranslator("startup_splash_title")).toBe("Hello");
    expect(pageTranslator("greeting")).toBe("Welcome");
  });

  it("waits to switch the reactive language until the next language is loaded", async () => {
    const frStartupDeferred = createDeferred<Record<string, string>>();
    const frPageDeferred = createDeferred<Record<string, string>>();

    const appI18n = createAppI18n({
      app: "test.app",
      defaultNamespace: "startup",
      modules: {
        "../i18n/en/startup.json": async () => ({
          startup_splash_title: "Hello",
        }),
        "../i18n/en/page.json": async () => ({
          greeting: "Welcome",
        }),
        "../i18n/fr/startup.json": async () => frStartupDeferred.promise,
        "../i18n/fr/page.json": async () => frPageDeferred.promise,
      },
    });

    await appI18n.ensureLanguageReady("en");

    const pendingChange = changeLanguage("fr");

    expect(getCurrentLanguage()).toBe("en");

    frStartupDeferred.resolve({
      startup_splash_title: "Bonjour",
    });
    frPageDeferred.resolve({
      greeting: "Salut",
    });

    await pendingChange;

    expect(getCurrentLanguage()).toBe("fr");
  });
});
