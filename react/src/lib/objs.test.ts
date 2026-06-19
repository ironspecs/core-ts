import { describe, expect, it } from "vitest";

import { deleteByPath, getByPath, getByPathOr, setByPath } from "./objs.js";

describe("setByPath", () => {
  it("sets a top-level property", () => {
    const obj = { a: 1 };
    const result = setByPath(obj, "b", 2);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it("sets a nested property", () => {
    const obj = { a: { b: 1 } };
    const result = setByPath(obj, "a.b", 2);
    expect(result).toEqual({ a: { b: 2 } });
  });

  it("sets a deeply nested property", () => {
    const obj = { a: { b: { c: 1 } } };
    const result = setByPath(obj, "a.b.c", 2);
    expect(result).toEqual({ a: { b: { c: 2 } } });
  });

  it("creates intermediate objects when path does not exist", () => {
    const obj = { a: 1 };
    const result = setByPath(obj, "b.c.d", 2);
    expect(result).toEqual({ a: 1, b: { c: { d: 2 } } });
  });

  it("creates arrays when next segment is numeric", () => {
    const obj = {};
    const result = setByPath(obj, "items.0.name", "x");
    expect(result).toEqual({ items: [{ name: "x" }] });
  });

  it("creates nested arrays and objects as needed", () => {
    const obj = {};
    const result = setByPath(obj, "a.0.b.1.c", 123);
    expect(result).toEqual({ a: [{ b: [undefined, { c: 123 }] }] });
  });

  it("overwrites non-object intermediate values with containers when needed (coerce)", () => {
    const obj = { a: 1 };
    const result = setByPath(obj, "a.b", 2);
    expect(result).toEqual({ a: { b: 2 } });
  });

  it("overwrites null intermediate values with containers when needed (coerce)", () => {
    const obj = { a: null as null | { b: number } };
    const result = setByPath(obj, "a.b", 2);
    expect(result).toEqual({ a: { b: 2 } });
  });

  it("handles arrays: updates a specific index", () => {
    const obj = { items: [1, 2, 3] };
    const result = setByPath(obj, "items.1", 5);
    expect(result).toEqual({ items: [1, 5, 3] });
  });

  it("handles root array: updates a specific index", () => {
    const arr = [1, 2, 3];
    const result = setByPath(arr, "1", 5);
    expect(result).toEqual([1, 5, 3]);
  });

  it("handles root array: expands when setting out of bounds index", () => {
    const arr = [1];
    const result = setByPath(arr, "2", 9);
    expect(result).toEqual([1, undefined, 9]);
  });

  it("does not mutate the original object", () => {
    const obj = { a: { b: 1 } };
    const result = setByPath(obj, "a.b", 2);
    expect(obj).toEqual({ a: { b: 1 } });
    expect(result).not.toBe(obj);
  });

  it("does not mutate the original array", () => {
    const obj = { items: [1, 2, 3] };
    const result = setByPath(obj, "items.1", 9);
    expect(obj).toEqual({ items: [1, 2, 3] });
    expect(result.items).toEqual([1, 9, 3]);
    expect(result.items).not.toBe(obj.items);
  });

  it("structural sharing: unchanged branches keep reference equality", () => {
    const shared = { keep: true };
    const obj = { a: { b: 1 }, shared };
    const result = setByPath(obj, "a.b", 2);

    expect(result.shared).toBe(shared);
    expect(result.a).not.toBe(obj.a);
  });

  it("returns the object unchanged for empty path", () => {
    const obj = { a: 1 };
    const result = setByPath(obj, "", 2);
    expect(result).toBe(obj);
  });

  it("returns the same reference when setting an existing value (no-op)", () => {
    const obj = { a: { b: 1 } };
    const result = setByPath(obj, "a.b", 1);
    expect(result).toBe(obj);
  });

  it("returns the same reference when setting an existing value on arrays (no-op)", () => {
    const obj = { items: [1, 2, 3] };
    const result = setByPath(obj, "items.1", 2);
    expect(result).toBe(obj);
  });

  it("throws on dangerous keys (__proto__)", () => {
    expect(() => setByPath({}, "__proto__.x", 1)).toThrow();
  });

  it("throws on dangerous keys (constructor)", () => {
    expect(() => setByPath({}, "constructor.prototype.x", 1)).toThrow();
  });

  it("throws on dangerous keys (prototype)", () => {
    expect(() => setByPath({}, "a.prototype.x", 1)).toThrow();
  });
});

describe("deleteByPath", () => {
  it("deletes a top-level property", () => {
    const obj = { a: 1, b: 2 };
    const result = deleteByPath(obj, "a");
    expect(result).toEqual({ b: 2 });
  });

  it("deletes a nested property", () => {
    const obj = { a: { b: 1, c: 2 } };
    const result = deleteByPath(obj, "a.b");
    expect(result).toEqual({ a: { c: 2 } });
  });

  it("deletes a deeply nested property", () => {
    const obj = { a: { b: { c: 1, d: 2 } } };
    const result = deleteByPath(obj, "a.b.c");
    expect(result).toEqual({ a: { b: { d: 2 } } });
  });

  it("does not mutate the original object", () => {
    const obj = { a: { b: 1 } };
    const result = deleteByPath(obj, "a.b");
    expect(obj).toEqual({ a: { b: 1 } });
    expect(result).not.toBe(obj);
  });

  it("returns object unchanged for empty path", () => {
    const obj = { a: 1 };
    const result = deleteByPath(obj, "");
    expect(result).toBe(obj);
  });

  it("returns original reference when path does not exist", () => {
    const obj = { a: 1 };
    const result = deleteByPath(obj, "b.c");
    expect(result).toBe(obj);
  });

  it("returns original reference when intermediate path is missing", () => {
    const obj = { a: { b: 1 } };
    const result = deleteByPath(obj, "a.x.y");
    expect(result).toBe(obj);
  });

  it("returns original reference when intermediate path is not an object", () => {
    const obj = { a: 1 };
    const result = deleteByPath(obj, "a.b");
    expect(result).toBe(obj);
  });

  it("handles null intermediate values (no change)", () => {
    const obj = { a: null };
    const result = deleteByPath(obj, "a.b");
    expect(result).toBe(obj);
  });

  it("arrays default to splice: removes element and shifts", () => {
    const obj = { items: [1, 2, 3] };
    const result = deleteByPath(obj, "items.1");
    expect(result).toEqual({ items: [1, 3] });
  });

  it("arrays: option delete leaves a hole (length unchanged)", () => {
    const obj = { items: [1, 2, 3] };
    const result = deleteByPath(obj, "items.1", { array: "delete" });
    expect(result.items).toHaveLength(3);
    expect(result.items[1]).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(result.items, 1)).toBe(false);
  });

  it("arrays: option undefined clears element but keeps slot as own property", () => {
    const obj = { items: [1, 2, 3] };
    const result = deleteByPath(obj, "items.1", { array: "undefined" });
    expect(result.items).toHaveLength(3);
    expect(result.items[1]).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(result.items, 1)).toBe(true);
  });

  it("handles root array with default splice", () => {
    const arr = [1, 2, 3];
    const result = deleteByPath(arr, "1");
    expect(result).toEqual([1, 3]);
  });

  it("handles root array with delete option (hole)", () => {
    const arr = [1, 2, 3];
    const result = deleteByPath(arr, "1", { array: "delete" });
    expect(result).toHaveLength(3);
    expect(result[1]).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(result, 1)).toBe(false);
  });

  it("structural sharing: unchanged branches keep reference equality", () => {
    const shared = { keep: true };
    const obj = { a: { b: 1, c: 2 }, shared };
    const result = deleteByPath(obj, "a.b");

    expect(result.shared).toBe(shared);
    expect(result.a).not.toBe(obj.a);
  });

  it("throws on dangerous keys (__proto__)", () => {
    expect(() => deleteByPath({ a: 1 }, "__proto__.x")).toThrow();
  });

  it("throws on dangerous keys (constructor)", () => {
    expect(() => deleteByPath({ a: 1 }, "constructor.prototype.x")).toThrow();
  });

  it("throws on dangerous keys (prototype)", () => {
    expect(() => deleteByPath({ a: 1 }, "a.prototype.x")).toThrow();
  });
});

describe("getByPath", () => {
  it("gets a top-level property", () => {
    const obj = { a: 1 };
    expect(getByPath(obj, "a")).toBe(1);
  });

  it("gets a nested property", () => {
    const obj = { a: { b: 2 } };
    expect(getByPath(obj, "a.b")).toBe(2);
  });

  it("returns undefined for missing path", () => {
    const obj = { a: { b: 2 } };
    expect(getByPath(obj, "a.c")).toBeUndefined();
  });

  it("returns undefined when encountering a primitive before the end", () => {
    const obj = { a: 1 };
    expect(getByPath(obj, "a.b.c")).toBeUndefined();
  });

  it("handles arrays by numeric index", () => {
    const obj = { items: ["x", "y"] };
    expect(getByPath(obj, "items.1")).toBe("y");
    expect(getByPath(obj, "items.2")).toBeUndefined();
  });

  it("handles root array", () => {
    const arr = [1, 2, 3];
    expect(getByPath(arr, "1")).toBe(2);
  });

  it("returns the root for empty path", () => {
    const obj = { a: 1 };
    expect(getByPath(obj, "")).toBe(obj);
  });

  it("throws on dangerous keys (__proto__)", () => {
    expect(() => getByPath({}, "__proto__.x")).toThrow();
  });

  it("throws on dangerous keys (constructor)", () => {
    expect(() => getByPath({}, "constructor.prototype.x")).toThrow();
  });

  it("throws on dangerous keys (prototype)", () => {
    expect(() => getByPath({}, "a.prototype.x")).toThrow();
  });
});

describe("getByPathOr", () => {
  it("returns found value", () => {
    const obj = { a: { b: 2 } };
    expect(getByPathOr(obj, "a.b", 9)).toBe(2);
  });

  it("returns fallback when missing", () => {
    const obj = { a: { b: 2 } };
    expect(getByPathOr(obj, "a.c", 9)).toBe(9);
  });

  it("does not treat null as missing", () => {
    const obj = { a: null };
    expect(getByPathOr(obj, "a", 9)).toBeNull();
  });

  it("does not treat false/0/'' as missing", () => {
    const obj = { a: false, b: 0, c: "" };
    expect(getByPathOr(obj, "a", true)).toBe(false);
    expect(getByPathOr(obj, "b", 1)).toBe(0);
    expect(getByPathOr(obj, "c", "x")).toBe("");
  });
});
