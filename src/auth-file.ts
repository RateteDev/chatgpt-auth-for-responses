import { readFile, writeFile } from "node:fs/promises";
import type { CodexAuthFile } from "./types.ts";

export async function readCodexAuth(authFile: string): Promise<CodexAuthFile> {
  const raw = await readFile(authFile, "utf-8");
  const parsed = JSON.parse(raw) as CodexAuthFile;
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid Codex auth file at ${authFile}`);
  }
  return parsed;
}

export async function writeCodexAuth(authFile: string, auth: CodexAuthFile): Promise<void> {
  await writeFile(authFile, `${JSON.stringify(auth, null, 2)}\n`, { mode: 0o600 });
}
