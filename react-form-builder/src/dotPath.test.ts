import { describe, expect, it } from "vitest";

import { getIn, setIn } from "./dotPath.js";

describe("setIn", () => {
  it("sets nested object values", () => {
    const result = setIn({}, "a.b.c", 5);
    expect(result).toEqual({ a: { b: { c: 5 } } });
  });

  it("creates arrays for numeric segments", () => {
    const result = setIn({}, "items.0.name", "alpha");
    expect(result).toEqual({ items: [{ name: "alpha" }] });
  });

  it("does not mutate the original target", () => {
    const original = { a: { b: 1 }, items: [{ name: "old" }] };
    const result = setIn(original, "items.0.name", "new");

    expect(result).toEqual({ a: { b: 1 }, items: [{ name: "new" }] });
    expect(original).toEqual({ a: { b: 1 }, items: [{ name: "old" }] });
  });

  it("uses an array root when the first segment is an index", () => {
    const result = setIn(
      null as unknown as Record<string, unknown>,
      "0.name",
      "x",
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([{ name: "x" }]);
  });

  it("uses an object root when the first segment is a key", () => {
    const result = setIn(
      0 as unknown as Record<string, unknown>,
      "root.value",
      7,
    );
    expect(result).toEqual({ root: { value: 7 } });
  });

  it("returns the value when the path is empty", () => {
    const result = setIn({ a: 1 }, "", 9);
    expect(result).toBe(9);
  });
});

describe("getIn", () => {
  it("reads nested values with numeric segments", () => {
    const data = { items: [{ name: "alpha" }] };
    expect(getIn(data, "items.0.name")).toBe("alpha");
  });
});
