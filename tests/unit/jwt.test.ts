import { describe, expect, test } from "bun:test";
import { chatgptAccountIdFromJwt, jwtIsExpiring } from "../../src/jwt.ts";

function makeJwt(claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${header}.${payload}.sig`;
}

describe("jwtIsExpiring", () => {
  test("returns true when exp is within skew", () => {
    const nowMs = 1_000_000_000_000;
    const token = makeJwt({ exp: nowMs / 1000 + 10 });
    expect(jwtIsExpiring(token, 60, nowMs)).toBe(true);
  });

  test("returns false when exp is well in the future", () => {
    const nowMs = 1_000_000_000_000;
    const token = makeJwt({ exp: nowMs / 1000 + 3600 });
    expect(jwtIsExpiring(token, 60, nowMs)).toBe(false);
  });

  test("returns true for malformed token", () => {
    expect(jwtIsExpiring("not-a-jwt", 60, Date.now())).toBe(true);
  });

  test("returns true when exp is missing", () => {
    const token = makeJwt({ sub: "user" });
    expect(jwtIsExpiring(token, 60, Date.now())).toBe(true);
  });
});

describe("chatgptAccountIdFromJwt", () => {
  test("extracts account ID from JWT claims", () => {
    const token = makeJwt({
      "https://api.openai.com/auth": { chatgpt_account_id: "acct-123" },
    });
    expect(chatgptAccountIdFromJwt(token)).toBe("acct-123");
  });

  test("returns null when auth claim is missing", () => {
    const token = makeJwt({ sub: "user" });
    expect(chatgptAccountIdFromJwt(token)).toBeNull();
  });

  test("returns null when account ID is empty", () => {
    const token = makeJwt({
      "https://api.openai.com/auth": { chatgpt_account_id: "" },
    });
    expect(chatgptAccountIdFromJwt(token)).toBeNull();
  });

  test("returns null for malformed token", () => {
    expect(chatgptAccountIdFromJwt("bad")).toBeNull();
  });
});
