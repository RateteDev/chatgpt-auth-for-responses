import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, resolve } from "node:path";
import type { ImageBackground, ImageData, ImageQuality } from "./images.ts";

export type Args = {
  prompt: string;
  references: string[];
  model?: string;
  size?: string;
  quality?: ImageQuality;
  background?: ImageBackground;
  n?: number;
  output?: string;
  authFile: string;
  json: boolean;
  help: boolean;
};

export function parseArgs(argv: string[]): Args {
  const opts: Record<string, string> = {};
  const references: string[] = [];
  const positional: string[] = [];
  const valued = new Set([
    "reference",
    "model",
    "size",
    "quality",
    "background",
    "n",
    "output",
    "auth-file",
  ]);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (arg === "--help" || arg === "-h") opts.help = "1";
    else if (arg === "--json") opts.json = "1";
    else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (!valued.has(key)) throw new Error(`unknown option: ${arg}`);
      const value = argv[++i];
      if (!value || value.startsWith("--")) throw new Error(`missing value for ${arg}`);
      if (key === "reference") references.push(value);
      else opts[key] = value;
    } else positional.push(arg);
  }
  if (opts.quality && !["low", "medium", "high", "auto"].includes(opts.quality)) {
    throw new Error(`invalid quality: ${opts.quality}`);
  }
  if (opts.background && !["transparent", "opaque", "auto"].includes(opts.background)) {
    throw new Error(`invalid background: ${opts.background}`);
  }
  const n = opts.n === undefined ? undefined : Number(opts.n);
  if (n !== undefined && (!Number.isSafeInteger(n) || n < 1))
    throw new Error("--n must be a positive integer");
  return {
    prompt: positional.join(" "),
    references,
    model: opts.model,
    size: opts.size,
    quality: opts.quality as ImageQuality | undefined,
    background: opts.background as ImageBackground | undefined,
    n,
    output: opts.output,
    authFile: opts["auth-file"] ?? resolve(homedir(), ".codex", "auth.json"),
    json: opts.json === "1",
    help: opts.help === "1",
  };
}

export function readReferenceImages(paths: string[]): Array<{ image_url: string }> {
  return paths.map((path) => {
    const bytes = readFileSync(path);
    const mime = bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
      ? "image/png"
      : bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))
        ? "image/jpeg"
        : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
          ? "image/webp"
          : undefined;
    if (!mime)
      throw new Error(`Unsupported reference image: ${path} (expected PNG, JPEG, or WebP)`);
    return { image_url: `data:${mime};base64,${bytes.toString("base64")}` };
  });
}

export function saveImages(data: ImageData[], output: string): string[] {
  if (data.length === 0 || data.some((image) => !image.b64_json))
    throw new Error("response had no image data");
  const target = resolve(output);
  const suffix = extname(target);
  const paths = data.map((_, i) =>
    data.length === 1
      ? target
      : `${target.slice(0, -suffix.length || undefined)}-${i + 1}${suffix}`,
  );
  for (const [i, image] of data.entries()) {
    const path = paths[i];
    if (!path) throw new Error("image output path is missing");
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.from(image.b64_json, "base64"));
  }
  return paths;
}
