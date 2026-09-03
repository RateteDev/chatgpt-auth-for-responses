import {
  CODEX_IMAGE_MODEL,
  CODEX_IMAGES_EDIT_PATH,
  CODEX_IMAGES_GENERATIONS_PATH,
} from "./constants.ts";
import type { CodexAuth } from "./types.ts";

export type ImageBackground = "transparent" | "opaque" | "auto";
export type ImageQuality = "low" | "medium" | "high" | "auto";

export type ImageGenerationRequest = {
  prompt: string;
  model?: string;
  background?: ImageBackground;
  quality?: ImageQuality;
  size?: string;
  n?: number;
};

export type ImageEditRequest = {
  images: Array<{ image_url: string }>;
  prompt: string;
  model?: string;
  background?: ImageBackground;
  quality?: ImageQuality;
  size?: string;
  n?: number;
};

export type ImageData = {
  b64_json: string;
};

export type ImageResponse = {
  created: number;
  data: ImageData[];
  background?: ImageBackground;
  quality?: ImageQuality;
  size?: string;
};

export type CodexImagesClient = {
  generate: (request: ImageGenerationRequest) => Promise<ImageResponse>;
  edit: (request: ImageEditRequest) => Promise<ImageResponse>;
};

/**
 * Create an image client that calls the private Codex ChatGPT image endpoints.
 *
 * Reuses the codex auth (`baseURL`, `originator`/`ChatGPT-Account-ID` headers,
 * access token) from a {@link CodexAuth} instance and issues the requests with
 * `fetch` directly, so no OpenAI SDK is required.
 *
 * Defaults mirror the Codex built-in `image_gen` tool (`gpt-image-2`, with
 * `background`/`quality`/`size` set to `"auto"`).
 */
export function createCodexImagesClient(auth: CodexAuth): CodexImagesClient {
  async function post(path: string, body: unknown): Promise<ImageResponse> {
    const { baseURL, headers, accessToken } = await auth.clientOptions();
    const res = await fetch(`${baseURL}${path}`, {
      method: "POST",
      headers: {
        ...headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Codex image request failed (${res.status}): ${text}`);
    }
    return (await res.json()) as ImageResponse;
  }

  return {
    generate: (request) => {
      const { prompt, ...rest } = request;
      const body = {
        prompt,
        background: rest.background ?? "auto",
        model: rest.model ?? CODEX_IMAGE_MODEL,
        quality: rest.quality ?? "auto",
        size: rest.size ?? "auto",
        ...(rest.n != null ? { n: rest.n } : {}),
      };
      return post(CODEX_IMAGES_GENERATIONS_PATH, body);
    },
    edit: (request) => {
      const { images, prompt, ...rest } = request;
      const body = {
        images,
        prompt,
        background: rest.background ?? "auto",
        model: rest.model ?? CODEX_IMAGE_MODEL,
        quality: rest.quality ?? "auto",
        size: rest.size ?? "auto",
        ...(rest.n != null ? { n: rest.n } : {}),
      };
      return post(CODEX_IMAGES_EDIT_PATH, body);
    },
  };
}
