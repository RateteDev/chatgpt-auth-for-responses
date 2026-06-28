# chatgpt-auth-for-responses

ChatGPT サブスクリプション（Plus / Pro）の OAuth トークンで [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses) を利用するための認証管理ライブラリ。

> **注意**: 公式 OpenAI API ではなく、Codex CLI が利用するプライベートエンドポイント (`https://chatgpt.com/backend-api/codex`) を対象としています。Codex CLI 側の仕様変更で予告なく壊れる可能性があります。プロダクション利用は非推奨です。

## インストール

```bash
bun add github:RateteDev/chatgpt-auth-for-responses
```

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
