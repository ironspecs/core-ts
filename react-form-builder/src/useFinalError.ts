/**
 * Safely convert an unknown error value to a string. Form errors may be
 * strings, objects with a message, or other types.
 */
export function errorToString(err: unknown): string {
  if (typeof err === "string") return err;
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof err.message === "string"
  ) {
    return err.message;
  }
  return JSON.stringify(err);
}

export function pickError(meta: {
  submitError?: unknown;
  error?: unknown;
}): string | null {
  const err = meta.submitError ?? meta.error ?? null;
  if (err === null) return null;
  return errorToString(err);
}
