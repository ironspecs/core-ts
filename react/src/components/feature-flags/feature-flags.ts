export type FeatureFlags = { [key: string]: string | undefined };

const queryName = "ff";
const cookieName = "ff";
const cookieRegex = new RegExp(`(^|; )${cookieName}=([^;]+)`);
const reloadGuardKey = "ffReloadGuard";

function setFeatureCookie(flags: Record<string, unknown>) {
  document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(flags))}; path=/`;
}

const getFeatureCookie = () => {
  const match = document.cookie.match(cookieRegex);

  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[2]));
    } catch {
      resetFeatureFlagsAndReload();
      throw new Error("Failed to parse feature flags cookie");
    }
  }

  return {};
};

function parseFeatureFlagsFromQuery(query: string): FeatureFlags {
  const flags: FeatureFlags = {};
  const pairs = query.split(",");

  pairs.forEach((pair) => {
    const [key, value] = pair.split(":", 2);

    flags[key] = value;
  });

  return flags;
}

export const resolveFeatureFlags = (): FeatureFlags => {
  const flags = getFeatureCookie();

  const ffParam = new URL(window.location.href).searchParams.get(queryName);
  if (ffParam) {
    Object.entries(parseFeatureFlagsFromQuery(ffParam)).forEach(
      ([key, value]) => {
        if (value === "") {
          delete flags[key];
          return;
        }

        flags[key] = value;
      },
    );

    setFeatureCookie(flags);
  }

  return flags;
};

export const resetFeatureFlagsAndReload = () => {
  if (!sessionStorage.getItem(reloadGuardKey)) {
    sessionStorage.setItem(reloadGuardKey, "true");
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    window.location.reload();
    return;
  }

  sessionStorage.removeItem(reloadGuardKey);
};

export function setFeatureFlagsAndReload(newFlags: FeatureFlags) {
  setFeatureCookie(newFlags);
  window.location.reload();
}
