import { describe, expect, it } from "vitest";

import {
  persistThemePreferenceSafe,
  resolveThemeSafe,
  type ThemePreferenceContext,
} from "./theme-preference.js";

type CookieAccessorFixture = {
  cookieAccessor: Pick<Document, "cookie">;
  writes: string[];
};

function createCookieAccessorFixture(input: {
  acceptedDomains?: Set<string>;
  initialCookies?: Record<string, string>;
}): CookieAccessorFixture {
  const acceptedDomains = input.acceptedDomains ?? new Set<string>();
  const values = new Map<string, string>(
    Object.entries(input.initialCookies ?? {}),
  );
  const writes: string[] = [];

  const cookieAccessor = {
    get cookie() {
      return [...values.entries()]
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");
    },
    set cookie(raw: string) {
      writes.push(raw);

      const [pair, ...attributeChunks] = raw
        .split(";")
        .map((chunk) => chunk.trim());
      if (!pair) {
        return;
      }

      const separatorIndex = pair.indexOf("=");
      if (separatorIndex < 0) {
        return;
      }

      const key = pair.slice(0, separatorIndex);
      const value = pair.slice(separatorIndex + 1);
      const attributes = new Map<string, string>();

      for (const chunk of attributeChunks) {
        const [name, ...rest] = chunk.split("=");
        attributes.set(name.toLowerCase(), rest.join("="));
      }

      const domain = attributes.get("domain")?.toLowerCase();
      if (domain && !acceptedDomains.has(domain)) {
        return;
      }

      if (attributes.get("max-age") === "0") {
        values.delete(key);
        return;
      }

      values.set(key, value);
    },
  };

  return { cookieAccessor: cookieAccessor as Pick<Document, "cookie">, writes };
}

function createContext(input: {
  cookieAccessor: Pick<Document, "cookie">;
  hostname: string;
  protocol: string;
  sharedCookieDomain?: string | null;
  darkPreferred?: boolean;
}): ThemePreferenceContext {
  return {
    cookieAccessor: input.cookieAccessor,
    host: {
      hostname: input.hostname,
      protocol: input.protocol,
    },
    options: {
      sharedCookieDomain: input.sharedCookieDomain ?? null,
    },
    matchMedia: () => ({
      matches: Boolean(input.darkPreferred),
    }),
  };
}

describe("theme-preference", () => {
  it("uses cookie when present", () => {
    const cookieFixture = createCookieAccessorFixture({
      initialCookies: { theme: "dark" },
      acceptedDomains: new Set(["example.com"]),
    });
    const context = createContext({
      cookieAccessor: cookieFixture.cookieAccessor,
      hostname: "app.example.com",
      protocol: "https:",
      sharedCookieDomain: "example.com",
      darkPreferred: false,
    });

    expect(resolveThemeSafe(context)).toBe("dark");
  });

  it("falls back to system preference when cookie is missing", () => {
    const cookieFixture = createCookieAccessorFixture({});
    const context = createContext({
      cookieAccessor: cookieFixture.cookieAccessor,
      hostname: "localhost",
      protocol: "http:",
      darkPreferred: true,
    });

    expect(resolveThemeSafe(context)).toBe("dark");
    expect(cookieFixture.writes).toHaveLength(0);
  });

  it("writes theme cookie to configured shared domain on matching host", () => {
    const cookieFixture = createCookieAccessorFixture({
      acceptedDomains: new Set(["example.com"]),
    });
    const context = createContext({
      cookieAccessor: cookieFixture.cookieAccessor,
      hostname: "app.example.com",
      protocol: "https:",
      sharedCookieDomain: "example.com",
    });

    persistThemePreferenceSafe("dark", context);

    const write = cookieFixture.writes.find((entry) =>
      entry.startsWith("theme=dark;"),
    );
    expect(write).toContain("Domain=example.com");
    expect(write).toContain("Secure");
  });

  it("falls back to host-only cookie when configured domain does not match host", () => {
    const cookieFixture = createCookieAccessorFixture({
      acceptedDomains: new Set(["example.com"]),
    });
    const context = createContext({
      cookieAccessor: cookieFixture.cookieAccessor,
      hostname: "localhost",
      protocol: "http:",
      sharedCookieDomain: "example.com",
    });

    persistThemePreferenceSafe("light", context);

    const write = cookieFixture.writes.find((entry) =>
      entry.startsWith("theme=light;"),
    );
    expect(write).toBe("theme=light; Path=/; Max-Age=31536000; SameSite=Lax");
  });

  it("decodes encoded cookie values safely", () => {
    const cookieFixture = createCookieAccessorFixture({
      initialCookies: { theme: "dark%20mode" },
    });
    const context = createContext({
      cookieAccessor: cookieFixture.cookieAccessor,
      hostname: "localhost",
      protocol: "http:",
      darkPreferred: false,
    });

    expect(resolveThemeSafe(context)).toBe("light");
  });
});
