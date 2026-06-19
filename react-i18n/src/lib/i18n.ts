/**
 * Owns supported language metadata, language normalization, fallback-chain
 * resolution, and strict i18next runtime helpers. Safe-prefixed functions are
 * the only helpers in this file that return absence instead of failing.
 */

type I18nInstance = {
  language: string;
  loadLanguages: (language: string | readonly string[]) => Promise<void>;
  changeLanguage: (language: string) => Promise<void>;
  loadNamespaces: (namespace: string | readonly string[]) => Promise<void>;
};

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", short: "EN" },
  { code: "es", name: "Español", short: "ES" },
  { code: "fr", name: "Français", short: "FR" },
  { code: "id", name: "Bahasa Indonesia", short: "ID" },
  { code: "ja", name: "日本語", short: "日本" },
  { code: "th", name: "ไทย", short: "ไทย" },
  { code: "zh-CN", name: "简体中文", short: "简" },
  { code: "zh-TW", name: "繁體中文", short: "繁" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(
  (language) => language.code,
);

const LANGUAGE_ALIAS_MAP = new Map<string, SupportedLanguage>([
  ["zh-hans", "zh-CN"],
  ["zh-cn", "zh-CN"],
  ["zh-sg", "zh-CN"],
  ["zh-hant", "zh-TW"],
  ["zh-tw", "zh-TW"],
  ["zh-hk", "zh-TW"],
]);

const RESOURCE_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  en: "en",
  es: "es",
  fr: "fr",
  id: "id",
  ja: "ja",
  th: "th",
  "zh-CN": "zh-Hans",
  "zh-TW": "zh-Hant",
};

const BASE_LANGUAGE_MAP = new Map<string, SupportedLanguage>([
  ["en", "en"],
  ["es", "es"],
  ["fr", "fr"],
  ["id", "id"],
  ["ja", "ja"],
  ["th", "th"],
]);

function safeResolveChineseVariant(
  normalizedInput: string,
  originalInput: string,
): SupportedLanguage | null {
  if (!normalizedInput.startsWith("zh")) return null;

  if (
    normalizedInput.includes("hans") ||
    normalizedInput.includes("cn") ||
    normalizedInput.includes("sg")
  ) {
    return "zh-CN";
  }

  if (
    normalizedInput.includes("hant") ||
    normalizedInput.includes("tw") ||
    normalizedInput.includes("hk") ||
    normalizedInput.includes("mo")
  ) {
    return "zh-TW";
  }

  try {
    if (typeof Intl !== "undefined" && "Locale" in Intl) {
      const locale = new Intl.Locale(originalInput);
      const maximized = locale.maximize ? locale.maximize() : locale;
      const script = maximized.script?.toLowerCase();
      if (script === "hant") return "zh-TW";
      if (script === "hans") return "zh-CN";
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeLanguageToken(input: string): string {
  return input.trim().replace("_", "-").toLowerCase();
}

function safeResolveAlias(input: string): SupportedLanguage | null {
  return LANGUAGE_ALIAS_MAP.get(input) ?? null;
}

function safeResolveBase(input: string): SupportedLanguage | null {
  const base = input.split("-")[0];
  return BASE_LANGUAGE_MAP.get(base) ?? null;
}

export function safeNormalizeLanguage(
  input: string | null | undefined,
): SupportedLanguage | null {
  if (!input) return null;
  const normalized = normalizeLanguageToken(input);
  if (!normalized) return null;

  const directMatch = SUPPORTED_LANGUAGE_CODES.find(
    (code) => code.toLowerCase() === normalized,
  );
  if (directMatch) return directMatch;

  const aliasMatch = safeResolveAlias(normalized);
  if (aliasMatch) return aliasMatch;

  const chineseVariant = safeResolveChineseVariant(normalized, input);
  if (chineseVariant) return chineseVariant;

  return safeResolveBase(normalized);
}

export function toResourceLanguage(language: SupportedLanguage): string {
  return RESOURCE_LANGUAGE_MAP[language];
}

export function safeGetNavigatorLanguages(): readonly string[] | null {
  if (typeof navigator === "undefined") return null;
  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return navigator.languages;
  }
  if (navigator.language) return [navigator.language];
  return null;
}

export function safeReadCachedLanguage(
  cacheKey: string = "appLanguage",
): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage?.getItem(cacheKey) ?? null;
  } catch {
    return null;
  }
}

export function safeReadPreferredCachedLanguage(
  options: {
    primaryCacheKey?: string;
  } = {},
): string | null {
  const primaryCacheKey = options.primaryCacheKey ?? "appLanguage";
  return safeReadCachedLanguage(primaryCacheKey);
}

export function safePickLanguageFromNavigator(
  languages: readonly string[] | null | undefined,
): SupportedLanguage | null {
  if (!languages || languages.length === 0) return null;
  for (const language of languages) {
    const normalized = safeNormalizeLanguage(language);
    if (normalized) return normalized;
  }
  return null;
}

export type ResolveAuthLanguageOptions = {
  queryLanguage?: string | null;
  cachedLanguage?: string | null;
  navigatorLanguages?: readonly string[] | null;
};

export function resolveAuthLanguage(
  options: ResolveAuthLanguageOptions,
): SupportedLanguage {
  const { queryLanguage, cachedLanguage, navigatorLanguages } = options;

  const fromQuery = safeNormalizeLanguage(queryLanguage);
  if (fromQuery) return fromQuery;

  const fromCache = safeNormalizeLanguage(cachedLanguage);
  if (fromCache) return fromCache;

  const fromNavigator = safePickLanguageFromNavigator(navigatorLanguages);
  if (fromNavigator) return fromNavigator;

  throw new Error(
    "Unable to resolve auth language. Provide query lang, cached language, or a supported browser language.",
  );
}

function toCanonicalLocaleTokenSafe(input: string): string {
  const normalized = input.trim().replaceAll("_", "-");
  if (!normalized) return "";

  try {
    if (typeof Intl !== "undefined" && "Locale" in Intl) {
      return new Intl.Locale(normalized).toString();
    }
  } catch {
    return normalized;
  }

  return normalized;
}

function pushUnique(target: string[], value: string): void {
  const next = value.trim();
  if (!next) return;
  if (target.some((item) => item.toLowerCase() === next.toLowerCase())) return;
  target.push(next);
}

function resolveChineseScriptTokenSafe(input: string): string | null {
  const lowered = input.toLowerCase();
  if (!lowered.startsWith("zh")) return null;

  if (
    lowered.includes("hans") ||
    lowered.includes("cn") ||
    lowered.includes("sg")
  ) {
    return "zh-Hans";
  }

  if (
    lowered.includes("hant") ||
    lowered.includes("tw") ||
    lowered.includes("hk") ||
    lowered.includes("mo")
  ) {
    return "zh-Hant";
  }

  return null;
}

/**
 * Resolve a deterministic locale fallback chain for language values that come
 * from outside the app (browser locale, server locale, query params, persisted
 * values).
 *
 * ALWAYS pass outside language values through this function before choosing
 * translations/content files so every caller applies the same fallback logic.
 *
 * Examples:
 *
 * - `zh-TW` -> `["zh-TW", "zh-Hant"]`
 * - `zh-CN` -> `["zh-CN", "zh-Hans"]`
 * - `en-US` -> `["en-US", "en"]`
 * - `fr-CA` -> `["fr-CA", "fr"]`
 */
export function safeResolveLanguageFallbackChain(
  input: string | null | undefined,
): string[] {
  if (!input) return [];

  const chain: string[] = [];
  const canonicalInput = toCanonicalLocaleTokenSafe(input);
  if (!canonicalInput) return [];

  pushUnique(chain, canonicalInput);

  const normalizedSupportedLanguage = safeNormalizeLanguage(canonicalInput);
  if (normalizedSupportedLanguage) {
    pushUnique(chain, normalizedSupportedLanguage);
    pushUnique(chain, toResourceLanguage(normalizedSupportedLanguage));
    if (!normalizedSupportedLanguage.startsWith("zh-")) {
      pushUnique(
        chain,
        normalizedSupportedLanguage.split("-")[0].toLowerCase(),
      );
    }

    return chain;
  }

  const chineseScript = resolveChineseScriptTokenSafe(canonicalInput);
  if (chineseScript) {
    pushUnique(chain, chineseScript);
    return chain;
  }

  const baseLanguage = canonicalInput.split("-")[0]?.toLowerCase();
  if (baseLanguage) pushUnique(chain, baseLanguage);

  return chain;
}

export function buildMissingTranslationTag(params: { key: string }): string {
  const key = params.key.trim();
  if (!key) {
    throw new Error("Missing translation key must be non-empty");
  }
  return key;
}

export function reportMissingTranslation(params: {
  app: string;
  language: string | readonly string[];
  namespace?: string;
  key: string;
}): void {
  const languageLabel = Array.isArray(params.language)
    ? params.language.join(", ")
    : params.language;
  const namespaceLabel = params.namespace ?? "(none)";
  console.warn(
    `[i18n] Missing translation app=${params.app} lang=${String(languageLabel)} ns=${namespaceLabel} key=${params.key}`,
  );
}

type I18nRuntimeState = {
  languageLoadPromises: Map<SupportedLanguage, Promise<void>>;
  namespaceLoadPromises: Map<string, Promise<void>>;
};

const i18nRuntimeStates = new WeakMap<I18nInstance, I18nRuntimeState>();

function getI18nRuntimeState(instance: I18nInstance): I18nRuntimeState {
  const existing = i18nRuntimeStates.get(instance);
  if (existing) return existing;

  const next: I18nRuntimeState = {
    languageLoadPromises: new Map<SupportedLanguage, Promise<void>>(),
    namespaceLoadPromises: new Map<string, Promise<void>>(),
  };
  i18nRuntimeStates.set(instance, next);
  return next;
}

async function ensureI18nLanguageResourcesLoaded(params: {
  i18n: I18nInstance;
  language: SupportedLanguage;
}): Promise<void> {
  const { i18n, language } = params;
  const runtime = getI18nRuntimeState(i18n);

  const existing = runtime.languageLoadPromises.get(language);
  if (existing) {
    await existing;
    return;
  }

  const loadPromise = i18n.loadLanguages(language).catch((error) => {
    runtime.languageLoadPromises.delete(language);
    throw error;
  });

  runtime.languageLoadPromises.set(language, loadPromise);
  await loadPromise;
}

export async function ensureI18nLanguageReady(params: {
  i18n: I18nInstance;
  language: SupportedLanguage;
}): Promise<void> {
  const { i18n, language } = params;
  await ensureI18nLanguageResourcesLoaded({ i18n, language });
  if (i18n.language !== language) {
    await i18n.changeLanguage(language);
  }
}

export async function ensureI18nNamespacesReady(params: {
  i18n: I18nInstance;
  language: SupportedLanguage;
  namespaces: string[];
}): Promise<void> {
  const { i18n, language, namespaces } = params;
  const runtime = getI18nRuntimeState(i18n);

  await ensureI18nLanguageReady({ i18n, language });

  const uniqueNamespaces = Array.from(new Set(namespaces));
  await Promise.all(
    uniqueNamespaces.map((namespace) => {
      const loadKey = `${language}:${namespace}`;
      const existing = runtime.namespaceLoadPromises.get(loadKey);
      if (existing) return existing;

      const loadPromise = i18n.loadNamespaces(namespace).catch((error) => {
        runtime.namespaceLoadPromises.delete(loadKey);
        throw error;
      });

      runtime.namespaceLoadPromises.set(loadKey, loadPromise);
      return loadPromise;
    }),
  );
}

type StrictI18nInitParams = {
  app: string;
  supportedLngs: readonly string[];
  namespaces: readonly string[];
  defaultNS: string;
};

type StrictI18nInitOptions = {
  fallbackLng: false;
  supportedLngs: string[];
  defaultNS: string;
  ns: string[];
  saveMissing: true;
  missingKeyHandler: (
    lngs: string | readonly string[],
    ns: string,
    key: string,
  ) => void;
  parseMissingKeyHandler: (key: string) => string;
  returnNull: false;
  returnEmptyString: false;
};

export function createStrictI18nInitOptions(
  params: StrictI18nInitParams,
): StrictI18nInitOptions {
  return {
    fallbackLng: false,
    supportedLngs: [...params.supportedLngs],
    defaultNS: params.defaultNS,
    ns: [...params.namespaces],
    returnNull: false,
    returnEmptyString: false,
    saveMissing: true,
    missingKeyHandler: (lngs, ns, key) => {
      reportMissingTranslation({
        app: params.app,
        language: lngs,
        namespace: ns,
        key,
      });
    },
    parseMissingKeyHandler: (key) => buildMissingTranslationTag({ key }),
  };
}
