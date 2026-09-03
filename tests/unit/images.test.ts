import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCodexAuth } from "../../src/auth.ts";
import type { ImageResponse } from "../../src/images.ts";
import { createCodexImagesClient } from "../../src/images.ts";

function makeJwt(claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${header}.${payload}.sig`;
}

const GENERATION_URL = "https://chatgpt.com/backend-api/codex/images/generations";
const EDIT_URL = "https://chatgpt.com/backend-api/codex/images/edits";

let tmpDir: string;
let authFile: string;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "codex-images-test-"));
  authFile = join(tmpDir, "auth.json");
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

function writeValidAuth(accountId?: string): string {
  const nowMs = 1_700_000_000_000;
  spyOn(Date, "now").mockReturnValue(nowMs);
  const token = makeJwt({
    exp: nowMs / 1000 + 3600,
    ...(accountId ? { "https://api.openai.com/auth": { chatgpt_account_id: accountId } } : {}),
  });
  writeFileSync(authFile, JSON.stringify({ tokens: { access_token: token, refresh_token: "rt" } }));
  return token;
}

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createCodexImagesClient.generate", () => {
  test("posts defaults to the generations endpoint with auth headers", async () => {
    const token = writeValidAuth("acct-test");
    const responseBody: ImageResponse = {
      created: 1778832973,
      data: [{ b64_json: "REDACT" }],
      background: "auto",
      quality: "auto",
      size: "1402x1122",
    };

    let capturedInit: RequestInit | undefined;
    globalThis.fetch = mock(async (input: string | URL | Request, init?: RequestInit) => {
      capturedInit = init;
      expect(String(input)).toBe(GENERATION_URL);
      return okResponse(responseBody);
    }) as unknown as typeof fetch;

    const client = createCodexImagesClient(createCodexAuth({ authFile }));
    const result = await client.generate({ prompt: "a red fox in a field" });

    expect(result).toEqual(responseBody);
    expect(capturedInit?.method).toBe("POST");
    const headers = new Headers(capturedInit?.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${token}`);
    expect(headers.get("originator")).toBe("codex_cli_rs");
    expect(headers.get("ChatGPT-Account-ID")).toBe("acct-test");
    expect(headers.get("Content-Type")).toContain("application/json");
    expect(JSON.parse(capturedInit?.body as string)).toEqual({
      prompt: "a red fox in a field",
      background: "auto",
      model: "gpt-image-2",
      quality: "auto",
      size: "auto",
    });
  });

  test("honours explicit model, background, quality, and size", async () => {
    writeValidAuth();
    const client = createCodexImagesClient(createCodexAuth({ authFile }));
    let capturedInit: RequestInit | undefined;
    globalThis.fetch = mock(async (_input: string | URL | Request, init?: RequestInit) => {
      capturedInit = init;
      return okResponse({ created: 1, data: [{ b64_json: "REDACT" }] });
    }) as unknown as typeof fetch;

    await client.generate({
      prompt: "portrait",
      model: "gpt-image-1.5",
      background: "opaque",
      quality: "high",
      size: "1024x1536",
    });

    expect(JSON.parse(capturedInit?.body as string)).toEqual({
      prompt: "portrait",
      background: "opaque",
      model: "gpt-image-1.5",
      quality: "high",
      size: "1024x1536",
    });
  });

  test("throws on a non-2xx response with status and body", async () => {
    writeValidAuth();
    globalThis.fetch = mock(
      async () =>
        new Response(JSON.stringify({ error: "usage_limit_reached" }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }),
    ) as unknown as typeof fetch;

    const client = createCodexImagesClient(createCodexAuth({ authFile }));
    await expect(client.generate({ prompt: "x" })).rejects.toThrow(/429/);
  });
});

describe("createCodexImagesClient.edit", () => {
  test("posts to the edits endpoint with images", async () => {
    writeValidAuth();
    let capturedInit: RequestInit | undefined;
    let capturedUrl = "";
    globalThis.fetch = mock(async (input: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedInit = init;
      return okResponse({ created: 1, data: [{ b64_json: "REDACT" }] });
    }) as unknown as typeof fetch;

    const client = createCodexImagesClient(createCodexAuth({ authFile }));
    await client.edit({
      images: [{ image_url: "data:image/png;base64,Zm9v" }],
      prompt: "add a red hat",
    });

    expect(capturedUrl).toBe(EDIT_URL);
    expect(JSON.parse(capturedInit?.body as string)).toEqual({
      images: [{ image_url: "data:image/png;base64,Zm9v" }],
      prompt: "add a red hat",
      background: "auto",
      model: "gpt-image-2",
      quality: "auto",
      size: "auto",
    });
  });
});
