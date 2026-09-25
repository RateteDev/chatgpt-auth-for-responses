# 認証

`codex --login` で認証ファイルを用意し、そのパスを `createCodexAuth({ authFile })` に渡します。アクセストークンの期限が近ければ、ライブラリが更新して認証ファイルへ保存します。

OpenAI SDKを使うときは、`clientOptions()` が返す `accessToken` を `apiKey` に、`headers` を `defaultHeaders` に渡します。`Authorization` は `headers` に含まれません。

```ts
import { createCodexAuth } from "chatgpt-auth-for-responses";
import OpenAI from "openai";

const auth = createCodexAuth({ authFile: "/path/to/.codex/auth.json" });
const { baseURL, headers, accessToken } = await auth.clientOptions();
const client = new OpenAI({ apiKey: accessToken, baseURL, defaultHeaders: headers });
```

アカウントIDはライブラリがトークンから取得し、必要なヘッダーに加えます。画像APIでも同じ認証オブジェクトを使えます。

認証ファイルの中身や認証ヘッダーは表示しないでください。401が返った場合は [エラー対応](troubleshooting.md) を参照します。
