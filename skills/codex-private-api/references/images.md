# 画像API

`createCodexImagesClient(auth)` で画像API用のクライアントを作ります。新しい画像は `generate({ prompt })`、参照画像を使う場合は `edit({ images, prompt })` を呼びます。

```ts
import { createCodexAuth, createCodexImagesClient } from "chatgpt-auth-for-responses";

const auth = createCodexAuth({ authFile: "/path/to/.codex/auth.json" });
const images = createCodexImagesClient(auth);
const response = await images.generate({ prompt: "a red fox in a meadow" });
const png = Buffer.from(response.data[0]!.b64_json, "base64");
```

`edit` に渡す `images` は `{ image_url: string }` の配列です。ローカル画像はMIMEタイプを含むdata URLにして渡します。レスポンスの `data` には、画像ごとにBase64形式の `b64_json` が入ります。

CLIから使う場合は `imagegen --help` を参照してください。モデルや既定値は `src/constants.ts` と `src/images.ts` にあります。
