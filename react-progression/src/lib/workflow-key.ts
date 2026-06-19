/**
 * Owns stable facts-key derivation for workflow runtime compilation. Keys are
 * deterministic for plain facts objects and fail fast on unsupported values.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function encodeString(value: string): string {
  return `${value.length}:${value}`;
}

function encodeNumber(value: number, path: string): string {
  if (!Number.isFinite(value)) {
    throw new Error(`Facts key contains a non-finite number at "${path}"`);
  }
  return `n(${value})`;
}

function encodeArray(values: unknown[], path: string): string {
  const encoded = values.map((value, index) =>
    encodeValue(value, `${path}[${index}]`),
  );
  return `a[${encoded.join(',')}]`;
}

function encodeObject(value: Record<string, unknown>, path: string): string {
  const keys = Object.keys(value).sort();
  const encodedEntries = keys.map((key) => {
    const nextPath = path ? `${path}.${key}` : key;
    return `${encodeString(key)}=${encodeValue(value[key], nextPath)}`;
  });
  return `o{${encodedEntries.join(',')}}`;
}

function encodeValue(value: unknown, path: string): string {
  if (value === null) return 'l';
  if (value === undefined) return 'u';
  if (typeof value === 'string') return `s(${encodeString(value)})`;
  if (typeof value === 'number') return encodeNumber(value, path);
  if (typeof value === 'boolean') return value ? 'b(1)' : 'b(0)';
  if (Array.isArray(value)) return encodeArray(value, path);
  if (isPlainObject(value)) return encodeObject(value, path);
  throw new Error(`Unsupported facts key value at "${path}"`);
}

export function deriveWorkflowFactsKey<Facts extends Record<string, unknown>>(
  facts: Readonly<Facts>,
): string {
  if (!isPlainObject(facts)) {
    throw new Error('Workflow facts key requires a plain object');
  }
  return encodeObject(facts, 'facts');
}
