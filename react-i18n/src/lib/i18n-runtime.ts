/**
 * Owns the minimal language-ready implementation for environments that do not
 * create an i18next-backed app runtime. It only updates the shared language.
 */

import type { SupportedLanguage } from "./i18n.js";
import { setCurrentLanguage } from "./language.js";

export async function ensureLanguageReady(
  language: SupportedLanguage,
): Promise<void> {
  setCurrentLanguage(language);
}
