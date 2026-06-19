/**
 * Verifies language normalization, fallback chains, and strict i18next helper
 * behavior without depending on a real i18next instance.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildMissingTranslationTag,
  createStrictI18nInitOptions,
  ensureI18nLanguageReady,
  ensureI18nNamespacesReady,
  safeReadCachedLanguage,
  safeReadPreferredCachedLanguage,
  safeResolveLanguageFallbackChain,
} from "./i18n.js";

type RuntimeI18nMock = Parameters<typeof ensureI18nLanguageReady>[0]["i18n"];

function installLocalStorageMock(): Map<string, string> {
  const storageValues = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storageValues.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storageValues.set(key, value);
      },
    },
  });
  return storageValues;
}

describe("safeResolveLanguageFallbackChain", () => {
  it("returns an empty chain for nullish input", () => {
    expect(safeResolveLanguageFallbackChain(undefined)).toEqual([]);
    expect(safeResolveLanguageFallbackChain(null)).toEqual([]);
    expect(safeResolveLanguageFallbackChain("")).toEqual([]);
  });

  it("resolves fallback chain for zh-TW", () => {
    expect(safeResolveLanguageFallbackChain("zh-TW")).toEqual([
      "zh-TW",
      "zh-Hant",
    ]);
  });

  it("resolves fallback chain for zh-CN", () => {
    expect(safeResolveLanguageFallbackChain("zh-CN")).toEqual([
      "zh-CN",
      "zh-Hans",
    ]);
  });

  it("resolves fallback chain for regional locales", () => {
    expect(safeResolveLanguageFallbackChain("en-US")).toEqual(["en-US", "en"]);
    expect(safeResolveLanguageFallbackChain("fr-CA")).toEqual(["fr-CA", "fr"]);
    expect(safeResolveLanguageFallbackChain("es-MX")).toEqual(["es-MX", "es"]);
    expect(safeResolveLanguageFallbackChain("de-DE")).toEqual(["de-DE", "de"]);
  });

  it("deduplicates aliases and canonical tokens", () => {
    expect(safeResolveLanguageFallbackChain("zh-hans")).toEqual([
      "zh-Hans",
      "zh-CN",
    ]);
    expect(safeResolveLanguageFallbackChain("en")).toEqual(["en"]);
  });
});

describe("cached language readers", () => {
  let storageValues: Map<string, string>;

  beforeEach(() => {
    storageValues = installLocalStorageMock();
  });

  it("reads only the requested cache key from safeReadCachedLanguage", () => {
    storageValues.set("otherLanguageKey", "fr");

    expect(safeReadCachedLanguage("appLanguage")).toBeNull();
  });

  it("reads the preferred app language cache key", () => {
    storageValues.set("appLanguage", "fr");

    expect(safeReadPreferredCachedLanguage()).toBe("fr");
  });
});

describe("buildMissingTranslationTag", () => {
  it("returns key exactly", () => {
    expect(buildMissingTranslationTag({ key: "pages:auth.signIn" })).toBe(
      "pages:auth.signIn",
    );
  });
});

describe("createStrictI18nInitOptions", () => {
  it("disables i18n fallback language", () => {
    const options = createStrictI18nInitOptions({
      app: "test-app",
      supportedLngs: ["en", "es"],
      namespaces: ["common"],
      defaultNS: "common",
    });

    expect(options.fallbackLng).toBe(false);
    expect(options.saveMissing).toBe(true);
    expect(options.returnEmptyString).toBe(false);
    expect(options.returnNull).toBe(false);
  });
});

function createRuntimeI18nMock(params?: { language?: string }): {
  i18n: RuntimeI18nMock;
  loadLanguages: ReturnType<typeof vi.fn>;
  changeLanguage: ReturnType<typeof vi.fn>;
  loadNamespaces: ReturnType<typeof vi.fn>;
} {
  const language = params?.language ?? "en";
  const loadLanguages = vi.fn(async () => {});
  const changeLanguage = vi.fn(async (nextLanguage: string) => {
    runtime.language = nextLanguage;
  });
  const loadNamespaces = vi.fn(async () => {});
  const runtime = {
    language,
    loadLanguages,
    changeLanguage,
    loadNamespaces,
  };

  return {
    i18n: runtime as unknown as RuntimeI18nMock,
    loadLanguages,
    changeLanguage,
    loadNamespaces,
  };
}

describe("ensureI18nLanguageReady", () => {
  it("deduplicates concurrent language loads for the same i18n instance", async () => {
    let releaseLoad!: () => void;
    const loadPromise = new Promise<void>((resolve) => {
      releaseLoad = () => resolve();
    });
    const { i18n, loadLanguages } = createRuntimeI18nMock();
    loadLanguages.mockImplementationOnce(() => loadPromise);

    const first = ensureI18nLanguageReady({ i18n, language: "es" });
    const second = ensureI18nLanguageReady({ i18n, language: "es" });

    expect(loadLanguages).toHaveBeenCalledTimes(1);
    releaseLoad();
    await Promise.all([first, second]);
  });

  it("retries load after a rejected attempt", async () => {
    const { i18n, loadLanguages } = createRuntimeI18nMock();
    loadLanguages.mockRejectedValueOnce(new Error("load failed"));

    await expect(
      ensureI18nLanguageReady({ i18n, language: "fr" }),
    ).rejects.toThrow("load failed");
    await ensureI18nLanguageReady({ i18n, language: "fr" });

    expect(loadLanguages).toHaveBeenCalledTimes(2);
  });

  it("changes language only when current language is different", async () => {
    const { i18n, changeLanguage } = createRuntimeI18nMock({ language: "en" });

    await ensureI18nLanguageReady({ i18n, language: "es" });
    await ensureI18nLanguageReady({ i18n, language: "es" });

    expect(changeLanguage).toHaveBeenCalledTimes(1);
    expect(changeLanguage).toHaveBeenCalledWith("es");
  });
});

describe("ensureI18nNamespacesReady", () => {
  it("deduplicates namespace loads by namespace key", async () => {
    const { i18n, loadNamespaces, changeLanguage } = createRuntimeI18nMock({
      language: "en",
    });

    await ensureI18nNamespacesReady({
      i18n,
      language: "id",
      namespaces: ["common", "forms", "common"],
    });

    expect(changeLanguage).toHaveBeenCalledWith("id");
    expect(loadNamespaces).toHaveBeenCalledTimes(2);
    expect(loadNamespaces).toHaveBeenNthCalledWith(1, "common");
    expect(loadNamespaces).toHaveBeenNthCalledWith(2, "forms");
  });

  it("retries namespace load after an error", async () => {
    const { i18n, loadNamespaces } = createRuntimeI18nMock({ language: "en" });
    loadNamespaces.mockRejectedValueOnce(new Error("namespace failed"));

    await expect(
      ensureI18nNamespacesReady({
        i18n,
        language: "en",
        namespaces: ["pages"],
      }),
    ).rejects.toThrow("namespace failed");
    await ensureI18nNamespacesReady({
      i18n,
      language: "en",
      namespaces: ["pages"],
    });

    expect(loadNamespaces).toHaveBeenCalledTimes(2);
  });
});
