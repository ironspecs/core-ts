/**
 * Verifies the label factory contract for namespace binding, memoization, and
 * type inference. Tests use a fake translator so app i18n setup stays separate.
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SupportedLanguage } from "./i18n.js";
import { createLabels } from "./labels.js";

describe("createLabels", () => {
  function setup() {
    let language: SupportedLanguage = "en";

    function setLanguage(lang: SupportedLanguage) {
      language = lang;
    }

    function useLanguage() {
      return language;
    }

    const getTranslator = vi.fn(
      ({
        language: currentLanguage,
        namespace,
      }: {
        language: SupportedLanguage;
        namespace: string;
      }) =>
        (key: string, options?: Record<string, unknown>) => {
          const suffix =
            typeof options?.count === "number" ? ` (${options.count})` : "";
          return `${currentLanguage}:${namespace}:${key}${suffix}`;
        },
    );

    const { useLabels } = createLabels({
      useLanguage,
      getTranslator,
    });
    return { useLabels, setLanguage, getTranslator };
  }

  describe("type inference", () => {
    it("infers the return type for namespaced factories", () => {
      const { useLabels } = setup();
      const { result } = renderHook(() =>
        useLabels("startup", (t) => ({
          title: "Hello",
          translatedTitle: t("startup_splash_title"),
          count: (n: number) => `${n}`,
        })),
      );

      const _title: string = result.current.title;
      const _translatedTitle: string = result.current.translatedTitle;
      const _count: (n: number) => string = result.current.count;
      expect(_title).toBe("Hello");
      expect(_translatedTitle).toBe("en:startup:startup_splash_title");
      expect(_count(1)).toBe("1");
    });
  });

  describe("namespaced mode", () => {
    it("passes a fixed translator for the requested namespace", () => {
      const { useLabels, getTranslator } = setup();

      const { result } = renderHook(() =>
        useLabels("startup", (t) => ({
          title: t("startup_splash_title"),
        })),
      );

      expect(result.current.title).toBe("en:startup:startup_splash_title");
      expect(getTranslator).toHaveBeenCalledWith({
        language: "en",
        namespace: "startup",
      });
    });

    it("re-runs when namespace changes", () => {
      const { useLabels } = setup();
      let namespace = "startup";

      const { result, rerender } = renderHook(() =>
        useLabels(namespace, (t) => ({
          title: t(`${namespace}_title`),
        })),
      );

      expect(result.current.title).toBe("en:startup:startup_title");

      namespace = "sign_in_page";
      rerender();

      expect(result.current.title).toBe("en:sign_in_page:sign_in_page_title");
    });

    it("re-runs when namespaced deps change", () => {
      const { useLabels } = setup();
      let count = 1;

      const { result, rerender } = renderHook(() =>
        useLabels(
          "startup",
          (t) => ({
            title: t("startup_splash_title", { count }),
          }),
          [count],
        ),
      );

      expect(result.current.title).toBe("en:startup:startup_splash_title (1)");

      count = 2;
      rerender();

      expect(result.current.title).toBe("en:startup:startup_splash_title (2)");
    });
  });

  describe("edge cases", () => {
    it("handles empty factory result", () => {
      const { useLabels } = setup();
      const { result } = renderHook(() => useLabels("startup", () => ({})));
      expect(result.current).toEqual({});
    });

    it("fails fast on an empty namespace", () => {
      const { useLabels } = setup();

      expect(() =>
        renderHook(() =>
          useLabels("  ", (t) => ({
            title: t("startup_splash_title"),
          })),
        ),
      ).toThrow("useLabels namespace must be non-empty");
    });

    it("factory is not called on every render", () => {
      const { useLabels } = setup();
      const factory = vi.fn(() => ({ title: "Hello" }));

      const { rerender } = renderHook(() => useLabels("startup", factory));
      rerender();
      rerender();
      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });
  });
});
