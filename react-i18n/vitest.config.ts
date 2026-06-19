/**
 * Owns the Vitest runtime configuration for the react-i18n package.
 * Component tests run in jsdom because LanguageSwitcher uses browser APIs.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["dist/", "node_modules/"],
  },
});
