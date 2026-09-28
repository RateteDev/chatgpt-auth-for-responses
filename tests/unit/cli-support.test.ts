import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs, readReferenceImages, saveImages } from "../../src/cli-support.ts";

describe("imagegen CLI inputs", () => {
  test("accepts repeated references and keeps legacy options optional", () => {
    expect(
      parseArgs(["a portrait", "--reference", "first.png", "--reference", "second.jpg"]).references,
    ).toEqual(["first.png", "second.jpg"]);
    expect(parseArgs(["a portrait"]).references).toEqual([]);
    expect(parseArgs(["a portrait", "--model", "gpt-image-2"]).model).toBe("gpt-image-2");
  });

  test("rejects invalid counts and unknown options instead of silently ignoring them", () => {
    expect(() => parseArgs(["a portrait", "--n", "0"])).toThrow();
    expect(() => parseArgs(["a portrait", "--n", "1.5"])).toThrow();
    expect(() => parseArgs(["a portrait", "--unknown", "value"])).toThrow();
  });
});

describe("imagegen reference files and results", () => {
  test("sends image bytes as data URLs in the given order and rejects non-images", () => {
    const dir = mkdtempSync(join(tmpdir(), "imagegen-reference-"));
    try {
      const png = join(dir, "one.png");
      const jpg = join(dir, "two.jpg");
      const invalid = join(dir, "fake.png");
      writeFileSync(png, Buffer.from("89504e470d0a1a0a00000000", "hex"));
      writeFileSync(jpg, Buffer.from("ffd8ffe00000", "hex"));
      writeFileSync(invalid, "not an image");
      const images = readReferenceImages([png, jpg]);
      expect(images).toEqual([
        { image_url: `data:image/png;base64,${readFileSync(png).toString("base64")}` },
        { image_url: `data:image/jpeg;base64,${readFileSync(jpg).toString("base64")}` },
      ]);
      expect(() => readReferenceImages([invalid])).toThrow(/Unsupported reference image/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("saves every returned image without overwriting a sibling or changing the single-image path", () => {
    const dir = mkdtempSync(join(tmpdir(), "imagegen-output-"));
    try {
      const output = join(dir, "result.png");
      const images = [
        { b64_json: Buffer.from("first").toString("base64") },
        { b64_json: Buffer.from("second").toString("base64") },
      ];
      expect(saveImages(images.slice(0, 1), output)).toEqual([output]);
      expect(readFileSync(output, "utf8")).toBe("first");
      expect(saveImages(images, output)).toEqual([
        join(dir, "result-1.png"),
        join(dir, "result-2.png"),
      ]);
      expect(readFileSync(join(dir, "result-2.png"), "utf8")).toBe("second");
      expect(readFileSync(output, "utf8")).toBe("first");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
