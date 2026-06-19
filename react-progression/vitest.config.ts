/**
 * Owns the test runner configuration for the react-progression package. Tests
 * run in jsdom because the package includes React components and hooks.
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
