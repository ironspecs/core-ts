/**
 * Owns startup hydration from the current-language store into an app-specific
 * language preparer. Apps pass the preparer returned by createAppI18n.
 */

import type { SupportedLanguage } from "./i18n.js";
import { initializeCurrentLanguageFromEnvironmentOrDefault } from "./language.js";

export async function bootstrapAppLanguage(params: {
  ensureLanguageReady: (language: SupportedLanguage) => Promise<void>;
}): Promise<void> {
  await params.ensureLanguageReady(
    initializeCurrentLanguageFromEnvironmentOrDefault(),
  );
}
