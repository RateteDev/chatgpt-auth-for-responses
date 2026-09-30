import { readCodexAuth, writeCodexAuth } from "./auth-file.ts";
import { CODEX_RESPONSES_BASE_URL, REFRESH_SKEW_SECONDS } from "./constants.ts";
import { chatgptAccountIdFromJwt, jwtIsExpiring } from "./jwt.ts";
import { refreshCodexTokens } from "./refresh.ts";
import type { ClientOptions, CodexAuth, CodexAuthFile, CodexAuthOptions } from "./types.ts";

/**
 * Create a Codex auth manager for the ChatGPT Responses API.
 *
 * Manages OAuth token lifecycle: reads `auth.json`, checks JWT expiry,
 * refreshes via `refresh_token` when needed, and writes back updated tokens.
 *
 * @remarks
 * This authenticates against a **private** ChatGPT endpoint
 * (`https://chatgpt.com/backend-api/codex`), not the official OpenAI API.
 * The endpoint imposes restrictions absent from the public API:
 *
 * - `input` must be an array (string shorthand returns 400).
 * - `stream: true` is mandatory (non-streaming returns 400).
 * - Available models are restricted by the ChatGPT subscription tier;
 *   consult `~/.codex/models_cache.json` for valid `slug` values.
 * - `instructions` (top-level) is effectively required; omitting it returns 400.
 *   `system` / `developer` role messages in the `input` array also return 400.
 * - Headers `originator` and `ChatGPT-Account-ID` are required
 *   (`clientOptions()` sets these automatically).
 */
export function createCodexAuth(options: CodexAuthOptions): CodexAuth {
  const { authFile } = options;

  async function resolveAccessToken(): Promise<string> {
    const auth = await readCodexAuth(authFile);
    const access = auth.tokens?.access_token ?? "";
    if (!access) {
      throw new Error(`Codex auth file has no access_token: ${authFile}`);
    }
    if (!jwtIsExpiring(access, REFRESH_SKEW_SECONDS, Date.now())) {
      return access;
    }
    return await refreshAndPersist(auth);
  }

  async function forceRefresh(): Promise<string> {
    const auth = await readCodexAuth(authFile);
    return await refreshAndPersist(auth);
  }

  async function refreshAndPersist(auth: CodexAuthFile): Promise<string> {
    const refresh = auth.tokens?.refresh_token ?? "";
    const refreshed = await refreshCodexTokens(refresh);
    const nextAuth: CodexAuthFile = {
      ...auth,
      tokens: {
        ...(auth.tokens ?? {}),
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
        ...(refreshed.id_token ? { id_token: refreshed.id_token } : {}),
      },
      last_refresh: new Date().toISOString(),
    };
    await writeCodexAuth(authFile, nextAuth);
    return refreshed.access_token;
  }

  async function clientOptions(): Promise<ClientOptions> {
    const accessToken = await resolveAccessToken();
    const acctId = chatgptAccountIdFromJwt(accessToken);
    return {
      baseURL: CODEX_RESPONSES_BASE_URL,
      headers: {
        "User-Agent": "codex_cli_rs/0.0.0",
        originator: "codex_cli_rs",
        ...(acctId ? { "ChatGPT-Account-ID": acctId } : {}),
      },
      accessToken,
    };
  }

  return { resolveAccessToken, forceRefresh, clientOptions };
}
