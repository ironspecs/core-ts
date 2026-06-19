/**
 * Owns shared test setup for react-progression component tests. It installs
 * DOM matchers and cleans mounted React trees after every test.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
