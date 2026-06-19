type PathSegment = string | number;

const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

type IndexableObject = Record<string, unknown>;
type Indexable = IndexableObject | unknown[];

function parsePath(path: string): PathSegment[] {
  return path
    .split(".")
    .filter(Boolean)
    .map((seg) => (/^(0|[1-9]\d*)$/.test(seg) ? Number(seg) : seg));
}

function isObjectLike(x: unknown): x is object {
  return x !== null && typeof x === "object";
}

function isIndexable(x: unknown): x is Indexable {
  if (!isObjectLike(x)) return false;
  return (
    Array.isArray(x) ||
    Object.getPrototypeOf(x) === Object.prototype ||
    Object.getPrototypeOf(x) === null
  );
}

function assertSafeKey(seg: PathSegment) {
  if (typeof seg === "string" && DANGEROUS_KEYS.has(seg)) {
    throw new Error(`Unsafe path segment: ${seg}`);
  }
}

function getAt(container: Indexable, seg: PathSegment): unknown {
  return typeof seg === "number"
    ? (container as unknown[])[seg]
    : (container as IndexableObject)[seg];
}

function hasAt(container: Indexable, seg: PathSegment): boolean {
  return typeof seg === "number"
    ? seg >= 0 && seg < (container as unknown[]).length
    : Object.prototype.hasOwnProperty.call(container as IndexableObject, seg);
}

function setAt(container: Indexable, seg: PathSegment, value: unknown): void {
  if (typeof seg === "number") (container as unknown[])[seg] = value;
  else (container as IndexableObject)[seg] = value;
}

function deleteAt(container: Indexable, seg: PathSegment): void {
  Reflect.deleteProperty(container, seg);
}

function cloneIndexable(x: Indexable): Indexable {
  return Array.isArray(x) ? x.slice() : { ...x };
}

function cloneOrCreateContainer(
  existing: unknown,
  preferArray: boolean,
): Indexable {
  if (Array.isArray(existing)) return existing.slice();
  if (isIndexable(existing) && !Array.isArray(existing)) {
    return { ...(existing as IndexableObject) };
  }
  return preferArray ? [] : {};
}

function cloneRoot<T extends object>(obj: T): T {
  if (Array.isArray(obj)) return obj.slice() as unknown as T;
  return { ...(obj as unknown as IndexableObject) } as unknown as T;
}

export function setByPath<T extends object>(
  obj: T,
  path: string,
  value: unknown,
): T {
  const parts = parsePath(path);
  if (parts.length === 0) return obj;

  {
    let cur: unknown = obj;
    let exists = true;

    for (const seg of parts) {
      assertSafeKey(seg);
      if (!isIndexable(cur) || !hasAt(cur, seg)) {
        exists = false;
        break;
      }
      cur = getAt(cur, seg);
    }

    if (exists && cur === value) return obj;
  }

  const root = cloneRoot(obj);
  let curNew: unknown = root;
  let curOld: unknown = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i]!;
    const nextSeg = parts[i + 1]!;
    assertSafeKey(seg);

    const newContainer = curNew as Indexable;
    const oldChild = isIndexable(curOld) ? getAt(curOld, seg) : undefined;
    const child = cloneOrCreateContainer(oldChild, typeof nextSeg === "number");

    setAt(newContainer, seg, child);

    curNew = child;
    curOld = oldChild;
  }

  const last = parts[parts.length - 1]!;
  assertSafeKey(last);
  setAt(curNew as Indexable, last, value);

  return root;
}

export function deleteByPath<T extends object>(
  obj: T,
  path: string,
  options: { array?: "splice" | "delete" | "undefined" } = {},
): T {
  const parts = parsePath(path);
  if (parts.length === 0) return obj;

  {
    let cur: unknown = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i]!;
      assertSafeKey(seg);
      if (!isIndexable(cur) || !hasAt(cur, seg)) return obj;
      cur = getAt(cur, seg);
    }

    const last = parts[parts.length - 1]!;
    assertSafeKey(last);
    if (!isIndexable(cur) || !hasAt(cur, last)) return obj;
  }

  const root = cloneRoot(obj);
  let curNew: unknown = root;
  let curOld: unknown = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i]!;
    assertSafeKey(seg);

    const newContainer = curNew as Indexable;
    const oldContainer = curOld as Indexable;
    const oldChild = getAt(oldContainer, seg);
    if (!isIndexable(oldChild)) return obj;

    const newChild = cloneIndexable(oldChild);
    setAt(newContainer, seg, newChild);

    curNew = newChild;
    curOld = oldChild;
  }

  const last = parts[parts.length - 1]!;
  assertSafeKey(last);

  const parent = curNew as Indexable;

  if (Array.isArray(parent) && typeof last === "number") {
    const mode = options.array ?? "splice";
    if (mode === "splice") parent.splice(last, 1);
    else if (mode === "undefined") parent[last] = undefined;
    else deleteAt(parent, last);
  } else {
    deleteAt(parent, last);
  }

  return root;
}

export function getByPath<T extends object, R = unknown>(
  obj: T,
  path: string,
): R | undefined {
  const parts = parsePath(path);
  if (parts.length === 0) return obj as unknown as R;

  let cur: unknown = obj;

  for (const seg of parts) {
    assertSafeKey(seg);
    if (!isIndexable(cur)) return undefined;
    cur = getAt(cur, seg);
  }

  return cur as R | undefined;
}

export function getByPathOr<T extends object, R>(
  obj: T,
  path: string,
  fallback: R,
): R {
  const value = getByPath<T, R>(obj, path);
  return value === undefined ? fallback : value;
}

export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export const createMock = <T extends object>(partial: DeepPartial<T>): T =>
  partial as T;
