/**
 * Owns the label factory that binds translated label objects to a caller-owned
 * language hook and namespace translator. This file does not own translation
 * files, namespace naming policy, or app-level i18n setup.
 */

import { useMemo } from "react";
import type { SupportedLanguage } from "./i18n.js";

export type LabelTranslator = (
  key: string,
  options?: Record<string, unknown>,
) => string;

/**
 * Creates a `useLabels` hook bound to a reactive language signal.
 *
 * @example
 *   ```ts
 *   import { createLabels, useCurrentLanguage } from "@core-ts/react-i18n";
 *   import { getLabelTranslator } from "@/lib/app-i18n";
 *
 *   export const { useLabels } = createLabels({
 *     useLanguage: useCurrentLanguage,
 *     getTranslator: getLabelTranslator,
 *   });
 *   ```;
 *
 * @param useLanguage - A React hook that returns the current language string.
 *   Must trigger a re-render when the language changes (e.g.
 *   useSyncExternalStore).
 */
export function createLabels(params: {
  useLanguage: () => SupportedLanguage;
  getTranslator: (context: {
    language: SupportedLanguage;
    namespace: string;
  }) => LabelTranslator;
}) {
  const { useLanguage, getTranslator } = params;

  function useNamespacedLabels<T>(
    namespace: string,
    factory: (t: LabelTranslator) => T,
    deps?: unknown[],
  ): T {
    const language = useLanguage();
    const trimmedNamespace = namespace.trim();
    if (!trimmedNamespace) {
      throw new Error("useLabels namespace must be non-empty");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(
      () => factory(getTranslator({ language, namespace: trimmedNamespace })),
      deps
        ? [language, trimmedNamespace, ...deps]
        : [language, trimmedNamespace],
    );
  }

  function useLabels<T>(
    namespace: string,
    factory: (t: LabelTranslator) => T,
  ): T;

  /**
   * Namespaced mode with extra deps: re-runs when language, namespace, or any
   * dep changes.
   */
  function useLabels<T>(
    namespace: string,
    factory: (t: LabelTranslator) => T,
    deps: unknown[],
  ): T;

  function useLabels<T>(
    namespace: string,
    factory: (t: LabelTranslator) => T,
    deps?: unknown[],
  ): T {
    if (typeof factory !== "function") {
      throw new Error(
        "useLabels(namespace, factory) requires a factory function",
      );
    }

    return useNamespacedLabels(namespace, factory, deps);
  }

  return { useLabels };
}
