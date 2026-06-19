import { describe, expect, test } from "vitest";

import { cn } from "./cn.js";

describe("cn", () => {
  test("joins plain class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("ignores falsy inputs", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });

  test("merges conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  test("keeps the last winning class across mixed inputs", () => {
    expect(cn("px-2", { "px-4": true }, ["text-sm", "text-lg"])).toBe(
      "px-4 text-lg",
    );
  });
});
