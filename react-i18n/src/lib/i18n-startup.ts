/**
 * Owns preferred-language startup preparation for values read from session or
 * profile data. Invalid or absent preferred languages are intentionally ignored.
 */

import type { SupportedLanguage } from "./i18n.js";
import { safeNormalizeLanguage } from "./i18n.js";

export async function safeEnsurePreferredLanguageReady(params: {
  ensureLanguageReady: (language: SupportedLanguage) => Promise<void>;
  preferredLanguage: string | null | undefined;
}): Promise<void> {
  const normalizedLanguage = safeNormalizeLanguage(params.preferredLanguage);

  if (!normalizedLanguage) {
    return;
  }

  await params.ensureLanguageReady(normalizedLanguage);
}
