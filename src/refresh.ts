import { CODEX_OAUTH_CLIENT_ID, CODEX_OAUTH_TOKEN_URL } from "./constants.ts";

export async function refreshCodexTokens(
  refreshToken: string,
): Promise<{ access_token: string; refresh_token: string; id_token?: string }> {
  if (!refreshToken.trim()) {
    throw new Error("Codex auth file is missing refresh_token");
  }
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: CODEX_OAUTH_CLIENT_ID,
  });
  const res = await fetch(CODEX_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Codex token refresh failed (${res.status}): ${text}`);
  }
  const payload = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
  };
  if (!payload.access_token) {
    throw new Error("Codex token refresh response missing access_token");
  }
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token ?? refreshToken,
    ...(payload.id_token ? { id_token: payload.id_token } : {}),
  };
}
