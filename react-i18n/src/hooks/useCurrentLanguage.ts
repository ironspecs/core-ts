/**
 * Owns the React subscription hook for the package current-language store.
 * The store itself lives in lib/language so non-React startup code can use it.
 */

import { useSyncExternalStore } from "react";
import {
  getCurrentLanguageSnapshot,
  subscribeCurrentLanguage,
} from "../lib/language.js";
import type { SupportedLanguage } from "../lib/i18n.js";

export function useCurrentLanguage(): SupportedLanguage {
  return useSyncExternalStore(
    subscribeCurrentLanguage,
    getCurrentLanguageSnapshot,
    getCurrentLanguageSnapshot,
  );
}
