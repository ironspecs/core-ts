export type Theme = "light" | "dark";

export const THEME_COOKIE_KEY = "theme";
const DEFAULT_THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type CookieAccessor = Pick<Document, "cookie">;

type HostContext = {
  hostname: string;
  protocol: string;
};

type MatchMediaAccessor = (query: string) => Pick<MediaQueryList, "matches">;

export type ThemePreferenceOptions = {
  sharedCookieDomain?: string | null;
  cookieMaxAgeSeconds?: number;
};

export type ThemePreferenceContext = {
  cookieAccessor: CookieAccessor;
  host?: HostContext;
  matchMedia?: MatchMediaAccessor;
  options?: ThemePreferenceOptions;
};

function resolveCookieMaxAgeSafe(
  options: ThemePreferenceOptions | undefined,
): number {
  const maxAge = options?.cookieMaxAgeSeconds;
  if (typeof maxAge === "number" && Number.isFinite(maxAge) && maxAge > 0) {
    return Math.floor(maxAge);
  }

  return DEFAULT_THEME_COOKIE_MAX_AGE_SECONDS;
}

function parseThemeSafe(value: string | null | undefined): Theme | null {
  if (value === "light" || value === "dark") {
    return value;
  }

  return null;
}

function normalizeDomainSafe(domain: string | null | undefined): string | null {
  if (!domain) {
    return null;
  }

  const normalized = domain.trim().toLowerCase().replace(/^\.+/, "");
  if (!normalized) {
    return null;
  }

  return normalized;
}

function readCookieValueSafe(cookieHeader: string, key: string): string | null {
  const raw = cookieHeader.split(";");
  for (const chunk of raw) {
    const trimmed = chunk.trim();
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }

    const name = trimmed.slice(0, separatorIndex);
    if (name !== key) {
      continue;
    }

    const value = trimmed.slice(separatorIndex + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

function preferredThemeSafe(matchMedia: MatchMediaAccessor | undefined): Theme {
  if (!matchMedia) {
    return "light";
  }

  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveCookieDomainSafe(
  hostname: string | undefined,
  sharedCookieDomain: string | null | undefined,
): string | null {
  if (!hostname) {
    return null;
  }

  const normalizedHost = hostname.trim().toLowerCase();
  const normalizedDomain = normalizeDomainSafe(sharedCookieDomain);
  if (!normalizedDomain) {
    return null;
  }

  if (
    normalizedHost === normalizedDomain ||
    normalizedHost.endsWith(`.${normalizedDomain}`)
  ) {
    return normalizedDomain;
  }

  return null;
}

function writeCookieSafe(
  cookieAccessor: CookieAccessor,
  key: string,
  value: string,
  attributes: string,
): void {
  cookieAccessor.cookie = `${key}=${encodeURIComponent(value)}; ${attributes}`;
}

export function resolveBrowserThemeContextSafe(
  options?: ThemePreferenceOptions,
): ThemePreferenceContext | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  return {
    cookieAccessor: document,
    host: {
      hostname: window.location.hostname,
      protocol: window.location.protocol,
    },
    matchMedia:
      typeof window.matchMedia === "function"
        ? window.matchMedia.bind(window)
        : undefined,
    options,
  };
}

export function resolveThemeSafe(
  context: ThemePreferenceContext | null = resolveBrowserThemeContextSafe(),
): Theme {
  if (!context) {
    return "light";
  }

  const cookieTheme = parseThemeSafe(
    readCookieValueSafe(context.cookieAccessor.cookie, THEME_COOKIE_KEY),
  );
  if (cookieTheme) {
    return cookieTheme;
  }

  return preferredThemeSafe(context.matchMedia);
}

export function readThemeFromDomSafe(
  documentRef: Document | null = typeof document === "undefined"
    ? null
    : document,
): Theme | null {
  if (!documentRef) {
    return null;
  }

  return parseThemeSafe(documentRef.documentElement.getAttribute("data-theme"));
}

export function persistThemePreferenceSafe(
  theme: Theme,
  context: ThemePreferenceContext | null = resolveBrowserThemeContextSafe(),
): void {
  if (!context?.host) {
    return;
  }

  const maxAge = resolveCookieMaxAgeSafe(context.options);
  const cookieDomain = resolveCookieDomainSafe(
    context.host.hostname,
    context.options?.sharedCookieDomain,
  );
  const domainAttribute = cookieDomain ? `; Domain=${cookieDomain}` : "";
  const secureAttribute = context.host.protocol === "https:" ? "; Secure" : "";

  writeCookieSafe(
    context.cookieAccessor,
    THEME_COOKIE_KEY,
    theme,
    `Path=/; Max-Age=${maxAge}; SameSite=Lax${domainAttribute}${secureAttribute}`,
  );
}

export function applyThemeAttributeSafe(
  theme: Theme,
  documentRef: Document | null = typeof document === "undefined"
    ? null
    : document,
): void {
  if (!documentRef) {
    return;
  }

  documentRef.documentElement.setAttribute("data-theme", theme);
  documentRef.documentElement.style.colorScheme = theme;
}
