/** Constant-time string comparison (length leak only). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Validates an HTTP Basic `Authorization` header.
 * Denies everything when credentials are not configured.
 */
export function isBasicAuthValid(
  header: string | null,
  user: string | undefined,
  password: string | undefined,
): boolean {
  if (!user || !password || !header?.startsWith("Basic ")) return false;
  let decoded: string;
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  const okUser = safeEqual(decoded.slice(0, sep), user);
  const okPass = safeEqual(decoded.slice(sep + 1), password);
  return okUser && okPass;
}
