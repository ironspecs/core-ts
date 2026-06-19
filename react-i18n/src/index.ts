/**
 * Owns the public exports for the react-i18n package. This file is only a
 * package boundary and does not add behavior beyond stable export paths.
 */

export { LanguageSwitcher } from "./components/LanguageSwitcher.js";
export type {
  LanguageSwitcherLabels,
  LanguageSwitcherProps,
} from "./components/LanguageSwitcher.js";
export { useCurrentLanguage } from "./hooks/useCurrentLanguage.js";
export { createAppI18n } from "./lib/app-i18n.js";
export type { AppI18n, CreateAppI18nParams } from "./lib/app-i18n.js";
export { bootstrapAppLanguage } from "./lib/bootstrap-app-language.js";
export {
  buildMissingTranslationTag,
  createStrictI18nInitOptions,
  ensureI18nLanguageReady,
  ensureI18nNamespacesReady,
  reportMissingTranslation,
  resolveAuthLanguage,
  safeGetNavigatorLanguages,
  safeNormalizeLanguage,
  safePickLanguageFromNavigator,
  safeReadCachedLanguage,
  safeReadPreferredCachedLanguage,
  safeResolveLanguageFallbackChain,
  SUPPORTED_LANGUAGE_CODES,
  SUPPORTED_LANGUAGES,
  toResourceLanguage,
} from "./lib/i18n.js";
export type {
  ResolveAuthLanguageOptions,
  SupportedLanguage,
} from "./lib/i18n.js";
export { ensureLanguageReady } from "./lib/i18n-runtime.js";
export { safeEnsurePreferredLanguageReady } from "./lib/i18n-startup.js";
export {
  changeLanguage,
  getCurrentLanguage,
  getCurrentLanguageSnapshot,
  initializeCurrentLanguageFromEnvironmentOrDefault,
  setCurrentLanguage,
  setLanguageChangePreparer,
  subscribeCurrentLanguage,
} from "./lib/language.js";
export { createLabels } from "./lib/labels.js";
export type { LabelTranslator } from "./lib/labels.js";
