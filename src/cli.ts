#!/usr/bin/env bun

import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { createCodexAuth } from "./auth.ts";
import type { ImageBackground, ImageQuality } from "./images.ts";
import { createCodexImagesClient } from "./images.ts";

const USAGE = `imagegen <prompt> [options]

Generate an image through the Codex ChatGPT image endpoint.

Options:
  --model <slug>        image model (default: gpt-image-2)
  --size <size>         e.g. 1024x1536 (default: auto)
  --quality <q>         low | medium | high | auto (default: auto)
  --background <bg>     transparent | opaque | auto (default: auto)
  --n <count>           number of images (default: 1)
  --output <path>       where to write the PNG (default: ./generated_images/imagegen-<ts>.png)
  --auth-file <path>    auth.json path (default: ~/.codex/auth.json)
  --json                print machine-readable JSON with the result path
`;

type Args = {
  prompt: string;
  model?: string;
  size?: string;
  quality?: ImageQuality;
  background?: ImageBackground;
  n?: number;
  output?: string;
  authFile: string;
  json: boolean;
};

function parseArgs(argv: string[]): Args {
  const opts: Record<string, string> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === undefined) {
      continue;
    }
    if (a === "--json") {
      opts.json = "1";
    } else if (a.startsWith("--") && a.length > 2) {
      const key = a.slice(2);
      const val = argv[++i];
      if (val === undefined) {
        throw new Error(`missing value for ${a}`);
      }
      opts[key] = val;
    } else {
      positional.push(a);
    }
  }
  const quality = opts.quality as ImageQuality | undefined;
  const background = opts.background as ImageBackground | undefined;
  for (const value of [quality, background]) {
    if (value && !["low", "medium", "high", "transparent", "opaque", "auto"].includes(value)) {
      throw new Error(`invalid value: ${value}`);
    }
  }
  return {
    prompt: positional.join(" "),
    model: opts.model,
    size: opts.size,
    quality,
    background,
    n: opts.n !== undefined ? Number(opts.n) : undefined,
    output: opts.output,
    authFile: opts["auth-file"] ?? resolve(homedir(), ".codex", "auth.json"),
    json: opts.json === "1",
  };
}

async function main() {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`imagegen: ${err instanceof Error ? err.message : String(err)}\n\n${USAGE}`);
    process.exit(1);
  }

  if (!args.prompt) {
    console.error(`imagegen: prompt is required\n\n${USAGE}`);
    process.exit(1);
  }

  const auth = createCodexAuth({ authFile: args.authFile });
  const images = createCodexImagesClient(auth);

  const response = await images.generate({
    prompt: args.prompt,
    ...(args.model ? { model: args.model } : {}),
    ...(args.size ? { size: args.size } : {}),
    ...(args.quality ? { quality: args.quality } : {}),
    ...(args.background ? { background: args.background } : {}),
    ...(args.n ? { n: args.n } : {}),
  });

  const data = response.data[0];
  if (!data?.b64_json) {
    console.error("imagegen: response had no image data");
    process.exit(1);
  }

  const output = args.output
    ? resolve(args.output)
    : resolve(process.cwd(), "generated_images", `imagegen-${Date.now()}.png`);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, Buffer.from(data.b64_json, "base64"));

  if (args.json) {
    console.log(
      JSON.stringify({
        path: output,
        size: response.size ?? null,
        quality: response.quality ?? null,
        created: response.created,
        b64_len: data.b64_json.length,
      }),
    );
  } else {
    console.log(output);
  }
}

main().catch((err) => {
  console.error(`imagegen: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
