import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCodexAuth } from "../../src/auth.ts";

function makeJwt(claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${header}.${payload}.sig`;
}

let tmpDir: string;
let authFile: string;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "codex-auth-test-"));
  authFile = join(tmpDir, "auth.json");
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe("resolveAccessToken", () => {
  test("returns existing token when not expiring", async () => {
    const nowMs = 1_700_000_000_000;
    spyOn(Date, "now").mockReturnValue(nowMs);
    const token = makeJwt({ exp: nowMs / 1000 + 3600 });
    writeFileSync(
      authFile,
      JSON.stringify({ tokens: { access_token: token, refresh_token: "rt" } }),
    );

    const auth = createCodexAuth({ authFile });
    const result = await auth.resolveAccessToken();
    expect(result).toBe(token);
  });

  test("refreshes when token is expiring and writes back", async () => {
    const nowMs = 1_700_000_000_000;
    spyOn(Date, "now").mockReturnValue(nowMs);
    const oldToken = makeJwt({ exp: nowMs / 1000 + 10 });
    const newToken = makeJwt({ exp: nowMs / 1000 + 3600 });
    writeFileSync(
      authFile,
      JSON.stringify({ tokens: { access_token: oldToken, refresh_token: "rt-old" } }),
    );

    globalThis.fetch = mock(async (url: string | URL | Request) => {
      expect(String(url)).toBe("https://auth.openai.com/oauth/token");
      return new Response(JSON.stringify({ access_token: newToken, refresh_token: "rt-new" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const auth = createCodexAuth({ authFile });
    const result = await auth.resolveAccessToken();
    expect(result).toBe(newToken);

    const persisted = JSON.parse(readFileSync(authFile, "utf-8"));
    expect(persisted.tokens.access_token).toBe(newToken);
    expect(persisted.tokens.refresh_token).toBe("rt-new");
  });

  test("throws when access_token is missing", async () => {
    writeFileSync(authFile, JSON.stringify({ tokens: { refresh_token: "rt" } }));

    const auth = createCodexAuth({ authFile });
    await expect(auth.resolveAccessToken()).rejects.toThrow(/no access_token/);
  });

  test("throws when auth file does not exist", async () => {
    const auth = createCodexAuth({ authFile: "/nonexistent/auth.json" });
    await expect(auth.resolveAccessToken()).rejects.toThrow();
  });
});

describe("forceRefresh", () => {
  test("refreshes regardless of token expiry", async () => {
    const nowMs = 1_700_000_000_000;
    const validToken = makeJwt({ exp: nowMs / 1000 + 3600 });
    const newToken = makeJwt({ exp: nowMs / 1000 + 7200 });
    writeFileSync(
      authFile,
      JSON.stringify({ tokens: { access_token: validToken, refresh_token: "rt" } }),
    );

    globalThis.fetch = mock(
      async () =>
        new Response(JSON.stringify({ access_token: newToken, refresh_token: "rt-new" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ) as unknown as typeof fetch;

    const auth = createCodexAuth({ authFile });
    const result = await auth.forceRefresh();
    expect(result).toBe(newToken);
  });
});

describe("clientOptions", () => {
  test("returns baseURL, headers, and accessToken", async () => {
    const nowMs = 1_700_000_000_000;
    spyOn(Date, "now").mockReturnValue(nowMs);
    const token = makeJwt({
      exp: nowMs / 1000 + 3600,
      "https://api.openai.com/auth": { chatgpt_account_id: "acct-test" },
    });
    writeFileSync(
      authFile,
      JSON.stringify({ tokens: { access_token: token, refresh_token: "rt" } }),
    );

    const auth = createCodexAuth({ authFile });
    const opts = await auth.clientOptions();

    expect(opts.baseURL).toBe("https://chatgpt.com/backend-api/codex");
    expect(opts.accessToken).toBe(token);
    expect(opts.headers.originator).toBe("codex_cli_rs");
    expect(opts.headers["ChatGPT-Account-ID"]).toBe("acct-test");
    expect(opts.headers["User-Agent"]).toContain("codex_cli_rs");
  });

  test("omits ChatGPT-Account-ID when JWT lacks account claim", async () => {
    const nowMs = 1_700_000_000_000;
    spyOn(Date, "now").mockReturnValue(nowMs);
    const token = makeJwt({ exp: nowMs / 1000 + 3600 });
    writeFileSync(
      authFile,
      JSON.stringify({ tokens: { access_token: token, refresh_token: "rt" } }),
    );

    const auth = createCodexAuth({ authFile });
    const opts = await auth.clientOptions();

    expect(opts.headers["ChatGPT-Account-ID"]).toBeUndefined();
  });

  test("does not include Authorization in headers", async () => {
    const nowMs = 1_700_000_000_000;
    spyOn(Date, "now").mockReturnValue(nowMs);
    const token = makeJwt({ exp: nowMs / 1000 + 3600 });
    writeFileSync(
      authFile,
      JSON.stringify({ tokens: { access_token: token, refresh_token: "rt" } }),
    );

    const auth = createCodexAuth({ authFile });
    const opts = await auth.clientOptions();

    expect(opts.headers.Authorization).toBeUndefined();
    expect(opts.accessToken).toBe(token);
  });
});
