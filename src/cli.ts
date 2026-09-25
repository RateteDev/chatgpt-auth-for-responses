#!/usr/bin/env bun

import { resolve } from "node:path";
import { createCodexAuth } from "./auth.ts";
import { parseArgs, readReferenceImages, saveImages } from "./cli-support.ts";
import { createCodexImagesClient } from "./images.ts";

const USAGE = `imagegen <prompt> [options]

Generate an image or edit reference images through the Codex ChatGPT image endpoint.

Options:
  --reference <path>    reference image (PNG, JPEG, WebP); repeat for multiple images
  --size <size>         e.g. 1024x1536 (default: auto)
  --quality <q>         low | medium | high | auto (default: auto)
  --background <bg>     transparent | opaque | auto (default: auto)
  --n <count>           number of images (default: 1)
  --output <path>       output PNG (default: ./generated_images/imagegen-<ts>.png)
  --auth-file <path>    auth.json path (default: ~/.codex/auth.json)
  --json                print machine-readable results
  --help                show this help

For multiple images, outputs use numbered suffixes (e.g. result-1.png, result-2.png).
`;

async function main() {
  let args: ReturnType<typeof parseArgs>;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`imagegen: ${err instanceof Error ? err.message : String(err)}\n\n${USAGE}`);
    process.exit(1);
  }
  if (args.help) {
    console.log(USAGE);
    return;
  }
  if (!args.prompt) {
    console.error(`imagegen: prompt is required\n\n${USAGE}`);
    process.exit(1);
  }

  const auth = createCodexAuth({ authFile: args.authFile });
  const images = createCodexImagesClient(auth);
  const request = {
    prompt: args.prompt,
    ...(args.model ? { model: args.model } : {}),
    ...(args.size ? { size: args.size } : {}),
    ...(args.quality ? { quality: args.quality } : {}),
    ...(args.background ? { background: args.background } : {}),
    ...(args.n ? { n: args.n } : {}),
  };
  const response = args.references.length
    ? await images.edit({ ...request, images: readReferenceImages(args.references) })
    : await images.generate(request);

  const output =
    args.output ?? resolve(process.cwd(), "generated_images", `imagegen-${Date.now()}.png`);
  const paths = saveImages(response.data, output);
  if (args.json) {
    const first = response.data[0];
    console.log(
      JSON.stringify(
        paths.length === 1
          ? {
              path: paths[0],
              size: response.size ?? null,
              quality: response.quality ?? null,
              created: response.created,
              b64_len: first?.b64_json.length,
            }
          : {
              paths,
              size: response.size ?? null,
              quality: response.quality ?? null,
              created: response.created,
            },
      ),
    );
  } else {
    for (const path of paths) console.log(path);
  }
}

main().catch((err) => {
  console.error(`imagegen: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
