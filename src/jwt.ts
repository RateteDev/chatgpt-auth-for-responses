function decodeJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const segment = parts[1];
  if (segment === undefined) return null;
  const padded = segment + "=".repeat((4 - (segment.length % 4)) % 4);
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const json = Buffer.from(normalized, "base64").toString("utf-8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function jwtIsExpiring(token: string, skewSeconds: number, nowMs: number): boolean {
  const claims = decodeJwtClaims(token);
  if (!claims) return true;
  const exp = claims.exp;
  if (typeof exp !== "number") return true;
  return exp <= nowMs / 1000 + Math.max(0, skewSeconds);
}

export function chatgptAccountIdFromJwt(token: string): string | null {
  const claims = decodeJwtClaims(token);
  if (!claims) return null;
  const auth = claims["https://api.openai.com/auth"];
  if (!auth || typeof auth !== "object") return null;
  const acct = (auth as Record<string, unknown>).chatgpt_account_id;
  return typeof acct === "string" && acct.length > 0 ? acct : null;
}
