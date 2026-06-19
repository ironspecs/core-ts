/**
 * Owns app-scoped i18next instance creation from caller-provided translation
 * modules. Apps own their module glob, app name, and default namespace.
 */

import { createInstance, type i18n as I18nInstance } from "i18next";
import {
  getCurrentLanguage,
  setCurrentLanguage,
  setLanguageChangePreparer,
} from "./language.js";
import {
  createStrictI18nInitOptions,
  safeNormalizeLanguage,
  toResourceLanguage,
  type SupportedLanguage,
  SUPPORTED_LANGUAGE_CODES,
} from "./i18n.js";
import type { LabelTranslator } from "./labels.js";
import { useCurrentLanguage } from "../hooks/useCurrentLanguage.js";

type TranslationResource = Record<string, string>;
type TranslationModuleWithDefault = { default: TranslationResource };
type TranslationModule = TranslationResource | TranslationModuleWithDefault;

type IndexedResources = Record<
  SupportedLanguage,
  Record<string, TranslationResource>
>;

export type CreateAppI18nParams = {
  app: string;
  defaultNamespace: string;
  modules: Record<string, TranslationModule | (() => Promise<unknown>)>;
};

export type AppI18n = {
  ensureLanguageReady: (language: SupportedLanguage) => Promise<void>;
  getLabelTranslator: (context: {
    language: SupportedLanguage;
    namespace: string;
  }) => LabelTranslator;
  resolveLocaleFromLanguage: (language: SupportedLanguage) => string;
  resolveCurrentLocale: () => string;
  useCurrentLocale: () => string;
};

function isTranslationResource(value: unknown): value is TranslationResource {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

function isTranslationModuleWithDefault(
  value: unknown,
): value is TranslationModuleWithDefault {
  return (
    typeof value === "object" &&
    value !== null &&
    "default" in value &&
    isTranslationResource(value.default)
  );
}

function unwrapTranslationModule(
  input: TranslationModule,
): TranslationResource {
  if (isTranslationModuleWithDefault(input)) return input.default;
  return input;
}

function toTranslationModule(value: unknown): TranslationModule {
  if (isTranslationResource(value)) return value;
  if (isTranslationModuleWithDefault(value)) return value;

  throw new Error("Unsupported translation module shape");
}

function parseTranslationModulePath(filePath: string): {
  language: SupportedLanguage;
  namespace: string;
} {
  const match = filePath.match(/\/i18n\/([^/]+)\/([^/]+)\.json$/);
  if (!match) {
    throw new Error(`Unsupported translation module path: ${filePath}`);
  }

  const resourceLanguage = match[1];
  const namespace = match[2]?.trim();
  const supportedLanguage = safeNormalizeLanguage(resourceLanguage);

  if (!supportedLanguage) {
    throw new Error(`Unsupported translation language: ${resourceLanguage}`);
  }
  if (!namespace) {
    throw new Error(`Missing translation namespace in path: ${filePath}`);
  }

  return {
    language: supportedLanguage,
    namespace,
  };
}

function createEmptyIndexedResources(): IndexedResources {
  return {
    en: {},
    es: {},
    fr: {},
    id: {},
    ja: {},
    th: {},
    "zh-CN": {},
    "zh-TW": {},
  };
}

function createEmptyIndexedLoaders(): Record<
  SupportedLanguage,
  Record<string, () => Promise<TranslationResource>>
> {
  return {
    en: {},
    es: {},
    fr: {},
    id: {},
    ja: {},
    th: {},
    "zh-CN": {},
    "zh-TW": {},
  };
}

function createLanguageNamespaceIndex(): Record<
  SupportedLanguage,
  Set<string>
> {
  return {
    en: new Set<string>(),
    es: new Set<string>(),
    fr: new Set<string>(),
    id: new Set<string>(),
    ja: new Set<string>(),
    th: new Set<string>(),
    "zh-CN": new Set<string>(),
    "zh-TW": new Set<string>(),
  };
}

async function resolveTranslationModule(
  source: TranslationModule | (() => Promise<unknown>),
): Promise<TranslationModule> {
  if (typeof source !== "function") {
    return source;
  }

  return toTranslationModule(await source());
}

function normalizeTranslationLoader(
  source: TranslationModule | (() => Promise<unknown>),
): () => Promise<TranslationResource> {
  return async () =>
    unwrapTranslationModule(await resolveTranslationModule(source));
}

function createIndexedTranslations(modules: CreateAppI18nParams["modules"]): {
  initialResources: IndexedResources;
  languageNamespaces: Record<SupportedLanguage, Set<string>>;
  loaders: Record<
    SupportedLanguage,
    Record<string, () => Promise<TranslationResource>>
  >;
  namespaces: string[];
} {
  const namespaces = new Set<string>();
  const initialResources = createEmptyIndexedResources();
  const loaders = createEmptyIndexedLoaders();
  const languageNamespaces = createLanguageNamespaceIndex();

  for (const [filePath, moduleValue] of Object.entries(modules)) {
    const { language, namespace } = parseTranslationModulePath(filePath);
    namespaces.add(namespace);
    languageNamespaces[language].add(namespace);
    loaders[language][namespace] = normalizeTranslationLoader(moduleValue);

    if (typeof moduleValue !== "function") {
      initialResources[language][namespace] =
        unwrapTranslationModule(moduleValue);
    }
  }

  return {
    initialResources,
    languageNamespaces,
    loaders,
    namespaces: Array.from(namespaces).sort(),
  };
}

function assertNamespaceKnown(
  namespace: string,
  namespaces: readonly string[],
): void {
  if (!namespaces.includes(namespace)) {
    throw new Error(`Unknown i18n namespace: ${namespace}`);
  }
}

function createTranslator(params: {
  i18n: I18nInstance;
  namespaces: readonly string[];
  language: SupportedLanguage;
  namespace: string;
}): LabelTranslator {
  const { i18n, namespaces, language, namespace } = params;
  assertNamespaceKnown(namespace, namespaces);
  if (!i18n.hasResourceBundle(language, namespace)) {
    throw new Error(
      `I18n namespace "${namespace}" is not loaded for language "${language}"`,
    );
  }
  const fixedTranslator = i18n.getFixedT(language, namespace);

  return (key, options) => {
    const directValue = fixedTranslator(key, options);
    return String(directValue);
  };
}

export function createAppI18n(params: CreateAppI18nParams): AppI18n {
  const { app, defaultNamespace, modules } = params;
  const { namespaces, initialResources, languageNamespaces, loaders } =
    createIndexedTranslations(modules);
  assertNamespaceKnown(defaultNamespace, namespaces);

  const i18n = createInstance();
  const initPromise = i18n.init({
    ...createStrictI18nInitOptions({
      app,
      supportedLngs: SUPPORTED_LANGUAGE_CODES,
      namespaces,
      defaultNS: defaultNamespace,
    }),
    lng: getCurrentLanguage(),
    resources: initialResources,
  });
  const loadedNamespaces = createLanguageNamespaceIndex();
  const languageLoadPromises = new Map<SupportedLanguage, Promise<void>>();

  for (const language of SUPPORTED_LANGUAGE_CODES) {
    for (const namespace of Object.keys(initialResources[language])) {
      loadedNamespaces[language].add(namespace);
    }
  }

  function isLanguageLoaded(language: SupportedLanguage): boolean {
    return (
      loadedNamespaces[language].size === languageNamespaces[language].size
    );
  }

  async function loadLanguageResources(
    language: SupportedLanguage,
  ): Promise<void> {
    if (isLanguageLoaded(language)) {
      return;
    }

    const existingPromise = languageLoadPromises.get(language);
    if (existingPromise) {
      await existingPromise;
      return;
    }

    const loadPromise = Promise.all(
      Object.entries(loaders[language]).map(async ([namespace, load]) => {
        if (loadedNamespaces[language].has(namespace)) {
          return;
        }

        const resource = await load();
        i18n.addResourceBundle(language, namespace, resource, true, true);
        loadedNamespaces[language].add(namespace);
      }),
    )
      .then(() => undefined)
      .catch((error: unknown) => {
        languageLoadPromises.delete(language);
        throw error;
      });

    languageLoadPromises.set(language, loadPromise);
    await loadPromise;
  }

  async function prepareLanguage(language: SupportedLanguage): Promise<void> {
    await initPromise;
    await loadLanguageResources(language);
    if (i18n.language !== language) {
      await i18n.changeLanguage(language);
    }
  }

  setLanguageChangePreparer(prepareLanguage);

  async function ensureLanguageReady(
    language: SupportedLanguage,
  ): Promise<void> {
    await prepareLanguage(language);
    setCurrentLanguage(language);
  }

  function getLabelTranslator(context: {
    language: SupportedLanguage;
    namespace: string;
  }): LabelTranslator {
    return createTranslator({
      i18n,
      namespaces,
      language: context.language,
      namespace: context.namespace,
    });
  }

  function resolveLocaleFromLanguage(language: SupportedLanguage): string {
    return toResourceLanguage(language);
  }

  function resolveCurrentLocale(): string {
    return resolveLocaleFromLanguage(getCurrentLanguage());
  }

  function useCurrentLocale(): string {
    const language = useCurrentLanguage();
    return resolveLocaleFromLanguage(language);
  }

  return {
    ensureLanguageReady,
    getLabelTranslator,
    resolveLocaleFromLanguage,
    resolveCurrentLocale,
    useCurrentLocale,
  };
}
