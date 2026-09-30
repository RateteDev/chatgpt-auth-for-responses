import { afterEach, describe, expect, mock, test } from "bun:test";
import { refreshCodexTokens } from "../../src/refresh.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("refreshCodexTokens", () => {
  test("returns new tokens on success", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify({
            access_token: "new-access",
            refresh_token: "new-refresh",
            id_token: "new-id",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    ) as unknown as typeof fetch;

    const result = await refreshCodexTokens("old-refresh");
    expect(result.access_token).toBe("new-access");
    expect(result.refresh_token).toBe("new-refresh");
    expect(result.id_token).toBe("new-id");
  });

  test("falls back to original refresh_token when response omits it", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(JSON.stringify({ access_token: "new-access" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ) as unknown as typeof fetch;

    const result = await refreshCodexTokens("old-refresh");
    expect(result.refresh_token).toBe("old-refresh");
  });

  test("throws on non-200 response", async () => {
    globalThis.fetch = mock(
      async () => new Response("bad", { status: 401 }),
    ) as unknown as typeof fetch;

    await expect(refreshCodexTokens("rt")).rejects.toThrow(/401/);
  });

  test("throws on empty refresh token", async () => {
    await expect(refreshCodexTokens("")).rejects.toThrow(/missing refresh_token/);
  });

  test("throws when response is missing access_token", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(JSON.stringify({ refresh_token: "rt" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ) as unknown as typeof fetch;

    await expect(refreshCodexTokens("rt")).rejects.toThrow(/missing access_token/);
  });
});
