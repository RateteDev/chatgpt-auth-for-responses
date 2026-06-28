# chatgpt-auth-for-responses

ChatGPT サブスクリプション（Plus / Pro）の OAuth トークンで OpenAI Responses API を利用するための認証管理ライブラリ。

## 開発コマンド

開発コマンドはすべて **Makefile** を使用する。

- `make test` — `bun test`
- `make lint` / `make format` — Biome
- `make typecheck` — `tsc --noEmit`
- `make ci` — typecheck + lint + test
- `make help` — 一覧

## ディレクトリ構成

```
src/
  index.ts        — public barrel export
  auth.ts         — createCodexAuth factory
  jwt.ts          — JWT decode / expiry check / account ID extraction
  refresh.ts      — OAuth token refresh
  auth-file.ts    — auth.json read / write
  constants.ts    — endpoint URL, OAuth client ID, etc.
  types.ts        — public type definitions
tests/unit/
  jwt.test.ts
  refresh.test.ts
  auth.test.ts
```

## 公開 API

```ts
function createCodexAuth(options: { authFile: string }): CodexAuth;

type CodexAuth = {
  resolveAccessToken(): Promise<string>;
  forceRefresh(): Promise<string>;
  clientOptions(): Promise<ClientOptions>;
};

type ClientOptions = {
  baseURL: string;
  headers: Record<string, string>;
  accessToken: string;
};
```

## 設計方針

- OpenAI SDK (`openai`) には一切依存しない。利用者側で SDK のクライアント生成を行う
- `auth.json` のパスは引数で受け取る（環境変数フォールバック禁止）
- Node.js 標準モジュール (`node:fs/promises`, `node:path`) と fetch のみ使用
- ビルドステップなし — `.ts` のまま配布（Bun 前提）

## エンドポイント固有の制限（公式 OpenAI API との差分）

- `input` は配列必須。文字列ショートハンドは 400
- `stream: true` 必須。非ストリーミングは 400
- 利用可能モデルは ChatGPT 側で制限される（`~/.codex/models_cache.json` の `slug` 一覧から選ぶ）
- 必須ヘッダ: `originator: codex_cli_rs`, `ChatGPT-Account-ID`（`clientOptions()` が自動付与）
- top-level `instructions` が事実上必須。`system` / `developer` ロールのメッセージは 400
