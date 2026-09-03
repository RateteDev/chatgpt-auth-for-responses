# chatgpt-auth-for-responses

ChatGPT サブスクリプション（Plus / Pro）の OAuth トークンで [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses) および Codex 画像生成エンドポイントを利用するための認証管理ライブラリ。

> **注意**: 公式 OpenAI API ではなく、Codex CLI が利用するプライベートエンドポイント (`https://chatgpt.com/backend-api/codex`) を対象としています。Codex CLI 側の仕様変更で予告なく壊れる可能性があります。プロダクション利用は非推奨です。

## インストール

```bash
bun add github:RateteDev/chatgpt-auth-for-responses
```

グローバルに `imagegen` コマンドを入れる場合：

```bash
bun add -g github:RateteDev/chatgpt-auth-for-responses
```

## CLI（imagegen）

`bun add -g` でインストールすると `imagegen` コマンドが使える。Codex 画像生成エンドポイントを呼び、PNG を保存してパス（`--json` で JSON）を出力する。

```bash
imagegen "a red fox in a sunlit meadow" --output ./fox.png --json
```

| オプション | 説明 |
|---|---|
| `--model <slug>` | 画像モデル（既定: `gpt-image-2`） |
| `--size <size>` | サイズ例 `1024x1536`（既定: `auto`） |
| `--quality <q>` | `low`/`medium`/`high`/`auto`（既定: `auto`） |
| `--background <bg>` | `transparent`/`opaque`/`auto`（既定: `auto`） |
| `--n <count>` | 生成枚数 |
| `--output <path>` | 保存先（既定: `./generated_images/imagegen-<ts>.png`） |
| `--auth-file <path>` | `auth.json` パス（既定: `~/.codex/auth.json`） |
| `--json` | パス等を機械可読JSONで出力 |

## 使い方

```ts
import { createCodexAuth } from "chatgpt-auth-for-responses";
import OpenAI from "openai";

const auth = createCodexAuth({ authFile: "/home/user/.codex/auth.json" });
const { baseURL, headers, accessToken } = await auth.clientOptions();

const client = new OpenAI({
  apiKey: accessToken,
  baseURL,
  defaultHeaders: headers,
});

const stream = await client.responses.create({
  model: "gpt-5.4-mini",
  instructions: "You are a helpful assistant.",
  input: [{ role: "user", content: [{ type: "input_text", text: "hello" }] }],
  stream: true,
  store: false,
});
```

### マルチターン会話

会話履歴を含める場合、`user` メッセージには `input_text`、`assistant` メッセージには `output_text` を使い分ける：

```ts
const stream = await client.responses.create({
  model: "gpt-5.4-mini",
  instructions: "You are a helpful assistant.",
  input: [
    { role: "user", content: [{ type: "input_text", text: "My name is Alice" }] },
    {
      type: "message",
      id: "msg_prev_0",
      role: "assistant",
      status: "completed",
      content: [{ type: "output_text", text: "Nice to meet you, Alice!", annotations: [] }],
    },
    { role: "user", content: [{ type: "input_text", text: "What is my name?" }] },
  ],
  stream: true,
  store: false,
});
```

> **注意**: `assistant` メッセージの `content` に `input_text` を使うと 400 (`"Supported values are: 'output_text' and 'refusal'"`) になる。OpenAI SDK の TypeScript 型 (`ResponseOutputMessage`) に合わせて `id`・`status`・`type: "message"` も必要。

## 画像生成

Codex のプライベート画像生成エンドポイントも同じ認証基盤から利用できる。`createCodexImagesClient` が `clientOptions()` の認証を再利用し、`/images/generations`（生成）と `/images/edits`（編集）へ `fetch` で直接アクセスする。OpenAI SDK は不要。

```ts
import { createCodexAuth, createCodexImagesClient } from "chatgpt-auth-for-responses";

const auth = createCodexAuth({ authFile: "/home/user/.codex/auth.json" });
const images = createCodexImagesClient(auth);

const response = await images.generate({ prompt: "a red fox in a sunlit meadow" });
const png = Buffer.from(response.data[0]!.b64_json, "base64");
```

既定値は Codex CLI の内蔵 `image_gen` ツールに合わせている（`model: "gpt-image-2"`、`background` / `quality` / `size` は `"auto"`）。`auto` はサーバー側で解決され、2026-09-03 の実測では `size=1402x1122` / `quality=low` になった。

| パラメータ | 型 | 既定 | 説明 |
|---|---|---|---|
| `prompt` | `string` | 必須 | 生成プロンプト |
| `model` | `string` | `"gpt-image-2"` | 他の画像モデル slug を指定可能 |
| `background` | `"transparent"\\|"opaque"\\|"auto"` | `"auto"` | 透過 / 不透明背景 |
| `quality` | `"low"\\|"medium"\\|"high"\\|"auto"` | `"auto"` | 生成品質 |
| `size` | `string` | `"auto"` | `"1024x1536"` 等のサイズ指定 |
| `n` | `number` | 省略 | 生成枚数 |

### `createCodexImagesClient(auth)`

`CodexAuth` を受け取り `CodexImagesClient` を返す。

| メソッド | 説明 |
|---|---|
| `generate(request)` | `POST /images/generations` を実行し `ImageResponse` を返す |
| `edit(request)` | `POST /images/edits` を実行し `ImageResponse` を返す |

`ImageResponse.data` は `{ b64_json: string }[]`。`b64_json` を Base64 デコードしてファイルへ書き出す。

## API

### `createCodexAuth(options)`

認証マネージャを生成する。

| パラメータ | 型 | 説明 |
|---|---|---|
| `options.authFile` | `string` | `auth.json` のファイルパス（必須） |

返り値: `CodexAuth`

### `CodexAuth`

| メソッド | 返り値 | 説明 |
|---|---|---|
| `resolveAccessToken()` | `Promise<string>` | 有効な access_token を返す。JWT の期限が切れていれば自動で refresh_token で更新し、`auth.json` に書き戻す |
| `forceRefresh()` | `Promise<string>` | 期限に関係なくトークンを強制リフレッシュする。401 エラー後のリトライ用途を想定 |
| `clientOptions()` | `Promise<ClientOptions>` | OpenAI SDK クライアント生成に必要な `baseURL`・`headers`・`accessToken` を返す |

### `ClientOptions`

```ts
type ClientOptions = {
  baseURL: string;
  headers: Record<string, string>;
  accessToken: string;
};
```

- `headers` にはエンドポイントが要求する `originator`、`ChatGPT-Account-ID` 等が含まれる
- `headers` に `Authorization` は含まれない。`accessToken` を OpenAI SDK の `apiKey` に渡すこと

## エンドポイント固有の制限

このエンドポイントは公式 OpenAI API と以下の点で異なる。利用者側（OpenAI SDK を呼ぶ側）で対応が必要：

| 制限 | 詳細 |
|---|---|
| `input` は配列必須 | 文字列ショートハンドは 400 (`"Input must be a list"`) |
| `stream: true` 必須 | 非ストリーミングリクエストは 400 (`"Stream must be set to true"`) |
| `store: false` 必須 | 省略または `true` は 400 (`"Store must be set to false"`) |
| モデル制限 | 利用可能モデルは ChatGPT サブスクリプションにより制限される。`~/.codex/models_cache.json` の `slug` 一覧から選ぶこと |
| `instructions` 必須 | top-level `instructions` を省略すると 400。`input` 配列内の `system` / `developer` ロールメッセージも 400 |
| `assistant` メッセージの content 型 | `output_text` を使うこと。`input_text` は 400 (`"Supported values are: 'output_text' and 'refusal'"`) |
| 必須ヘッダ | `originator: codex_cli_rs` と `ChatGPT-Account-ID` が必要（`clientOptions()` が自動付与） |

## 401 リトライの実装例

トークン期限切れで 401 が返った場合のリトライは利用者側で行う：

```ts
import { APIError } from "openai";

try {
  stream = await client.responses.create({ ... });
} catch (err) {
  if (err instanceof APIError && err.status === 401) {
    const newToken = await auth.forceRefresh();
    const newOpts = await auth.clientOptions();
    client = new OpenAI({
      apiKey: newToken,
      baseURL: newOpts.baseURL,
      defaultHeaders: newOpts.headers,
    });
    stream = await client.responses.create({ ... });
  } else {
    throw err;
  }
}
```

## 動作要件

- **Runtime**: [Bun](https://bun.sh/)
- **認証ファイル**: Codex CLI の `auth.json`（`codex --login` で生成される）
