/**
 * Owns the mutable current-language store and cache integration shared by
 * React hooks, startup code, and the language switcher. Importing this file
 * must not require browser globals; startup code initializes browser-derived
 * language preferences explicitly.
 */

import {
  resolveAuthLanguage,
  safeGetNavigatorLanguages,
  safeReadPreferredCachedLanguage,
  type SupportedLanguage,
} from "./i18n.js";

const LANGUAGE_CACHE_KEY = "appLanguage";

type Listener = () => void;

const listeners = new Set<Listener>();
let prepareLanguageChange:
  | ((language: SupportedLanguage) => Promise<void>)
  | null = null;

let currentLanguage: SupportedLanguage = "en";

function safeSetHtmlLanguage(language: SupportedLanguage): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
}

function safeCacheLanguage(language: SupportedLanguage): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(LANGUAGE_CACHE_KEY, language);
  } catch {
    // Ignore storage write failures.
  }
}

function notifySubscribers(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeCurrentLanguage(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCurrentLanguageSnapshot(): SupportedLanguage {
  return currentLanguage;
}

export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function setLanguageChangePreparer(
  nextPreparer: (language: SupportedLanguage) => Promise<void>,
): void {
  prepareLanguageChange = nextPreparer;
}

function resolveInitialLanguageOrDefault(): SupportedLanguage {
  try {
    return resolveAuthLanguage({
      cachedLanguage: safeReadPreferredCachedLanguage({
        primaryCacheKey: LANGUAGE_CACHE_KEY,
      }),
      navigatorLanguages: safeGetNavigatorLanguages(),
    });
  } catch {
    return "en";
  }
}

export function initializeCurrentLanguageFromEnvironmentOrDefault(): SupportedLanguage {
  return setCurrentLanguage(resolveInitialLanguageOrDefault());
}

export function setCurrentLanguage(
  language: SupportedLanguage,
): SupportedLanguage {
  if (language === currentLanguage) {
    safeSetHtmlLanguage(currentLanguage);
    return currentLanguage;
  }

  currentLanguage = language;
  safeCacheLanguage(currentLanguage);
  safeSetHtmlLanguage(currentLanguage);
  notifySubscribers();
  return currentLanguage;
}

export async function changeLanguage(
  language: SupportedLanguage,
): Promise<SupportedLanguage> {
  if (prepareLanguageChange) {
    await prepareLanguageChange(language);
  }

  return setCurrentLanguage(language);
}
