# 画像API

`createCodexImagesClient(auth)` が認証を引き継ぎます。`generate({ prompt })` は新規画像、`edit({ images, prompt })` は参照画像を使う生成です。`images` の各要素は `{ image_url: string }` で、ローカル画像を送る場合は画像のMIMEタイプを含むdata URLにします。

```ts
import { createCodexAuth, createCodexImagesClient } from "chatgpt-auth-for-responses";

const auth = createCodexAuth({ authFile: "/path/to/.codex/auth.json" });
const images = createCodexImagesClient(auth);
const response = await images.generate({ prompt: "a red fox in a meadow" });
const png = Buffer.from(response.data[0]!.b64_json, "base64");
```

レスポンスの `data` は画像ごとの `b64_json` を含みます。CLIから使う場合は `imagegen --help` を参照してください。APIのモデルや既定値を変更する際は `src/constants.ts` と `src/images.ts` を確認します。
