export function joinName(base: string, rel: string): string {
  if (!base) return rel;
  if (!rel) return base;
  return `${base}.${rel}`;
}

export function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x : "")).filter((x) => x !== "");
}

export function asObjectArray(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) =>
    x && typeof x === "object" ? (x as Record<string, unknown>) : {},
  );
}

export type DotPath = string;

export function isIndexToken(t: string): boolean {
  return /^(0|[1-9]\d*)$/.test(t);
}

export function splitDotPath(path: DotPath): string[] {
  if (!path) return [];
  return path.split(".").filter(Boolean);
}

/**
 * Read a value from an object using a dot path. Supports numeric segments for
 * arrays: "a.0.b"
 */
export function getIn(obj: unknown, path: DotPath): unknown {
  const parts = splitDotPath(path);
  let cur: unknown = obj;

  for (const p of parts) {
    if (cur == null) return undefined;
    cur = isIndexToken(p)
      ? (cur as unknown[])[Number(p)]
      : (cur as Record<string, unknown>)[p];
  }
  return cur;
}

type Obj = Record<string, unknown>;
type Container = Obj | unknown[];

function isContainer(v: unknown): v is Container {
  return v != null && typeof v === "object";
}

function cloneContainer(v: unknown): Container {
  if (Array.isArray(v)) return v.slice();
  if (isContainer(v)) return { ...(v as Obj) };
  return {};
}

function readChild(container: Container, key: string): unknown {
  if (isIndexToken(key)) return (container as unknown[])[Number(key)];
  return (container as Obj)[key];
}

function writeChild(container: Container, key: string, value: unknown): void {
  if (isIndexToken(key)) (container as unknown[])[Number(key)] = value;
  else (container as Obj)[key] = value;
}

function ensureNextContainer(
  existing: unknown,
  nextShouldBeArray: boolean,
): Container {
  if (!isContainer(existing)) return nextShouldBeArray ? [] : {};
  if (Array.isArray(existing)) return existing.slice();
  return { ...(existing as Obj) };
}

// ---- refactored setIn

/**
 * Set a value into an object using a dot path. Creates intermediate
 * objects/arrays as needed.
 *
 * - Used to CONSTRUCT a patch object.
 * - No merge semantics here; the server merges.
 */
export function setIn<T>(target: T, path: DotPath, value: unknown): T {
  const parts = splitDotPath(path);
  if (parts.length === 0) return value as T;

  const root = isContainer(target)
    ? cloneContainer(target)
    : isIndexToken(parts[0])
      ? []
      : {};
  let cur: Container = root;

  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    const last = i === parts.length - 1;

    if (last) {
      writeChild(cur, key, value);
      return root as T;
    }

    const nextKey = parts[i + 1];
    const nextShouldBeArray = isIndexToken(nextKey);

    const existing = readChild(cur, key);
    const next = ensureNextContainer(existing, nextShouldBeArray);

    writeChild(cur, key, next);
    cur = next;
  }

  return root as T;
}
