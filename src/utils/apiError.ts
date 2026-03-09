/**
 * Narrows an unknown RTK Query rejection to a typed API error shape.
 * Replaces the non-existent `isFetchBaseQueryError` from older RTK versions.
 */
export function isApiError(
  err: unknown,
): err is { data: { message?: string; statusCode?: number } } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'data' in err &&
    typeof (err as Record<string, unknown>).data === 'object' &&
    (err as Record<string, unknown>).data !== null
  );
}

/**
 * Extracts a human-readable message from any thrown value.
 * Falls back to `fallback` when nothing useful is found.
 */
export function getApiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong',
): string {
  if (isApiError(err)) return err.data.message ?? fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}
