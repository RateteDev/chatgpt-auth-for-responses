export const CODEX_OAUTH_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
export const CODEX_OAUTH_TOKEN_URL = "https://auth.openai.com/oauth/token";
export const CODEX_RESPONSES_BASE_URL = "https://chatgpt.com/backend-api/codex";
export const REFRESH_SKEW_SECONDS = 60;

// Private Codex image endpoints, relative to CODEX_RESPONSES_BASE_URL.
export const CODEX_IMAGES_GENERATIONS_PATH = "/images/generations";
export const CODEX_IMAGES_EDIT_PATH = "/images/edits";

// Default model used by the Codex built-in `image_gen` tool (codex-cli 0.151.0).
export const CODEX_IMAGE_MODEL = "gpt-image-2";
