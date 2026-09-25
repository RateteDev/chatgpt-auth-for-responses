# 認証

`createCodexAuth({ authFile })` に `codex --login` が生成した `auth.json` のパスを渡します。ライブラリはアクセストークンの期限が近いときに更新し、更新結果を認証ファイルへ保存します。パスは呼び出し側が明示します。

`clientOptions()` は `baseURL`、`headers`、`accessToken` を返します。OpenAI SDKを使う場合、`accessToken` を `apiKey` に、`headers` を `defaultHeaders` に渡します。`headers` に `Authorization` は含まれません。画像クライアントは同じ認証オブジェクトから必要なヘッダーを組み立てます。

```ts
import { createCodexAuth } from "chatgpt-auth-for-responses";
import OpenAI from "openai";

const auth = createCodexAuth({ authFile: "/path/to/.codex/auth.json" });
const { baseURL, headers, accessToken } = await auth.clientOptions();
const client = new OpenAI({ apiKey: accessToken, baseURL, defaultHeaders: headers });
```

必要なアカウントIDはトークンから取得してヘッダーへ入れます。認証ファイルの値やHTTP認証ヘッダーは表示しません。401への対応は [troubleshooting.md](troubleshooting.md) を参照してください。
