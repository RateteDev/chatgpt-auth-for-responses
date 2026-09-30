# @ratetedev/chatgpt-auth-for-responses

<a href="https://www.npmjs.com/package/@ratetedev/chatgpt-auth-for-responses"><img src="https://img.shields.io/npm/v/@ratetedev/chatgpt-auth-for-responses?color=CB3837&logo=npm" alt="バージョン: @ratetedev/chatgpt-auth-for-responses"></a>

Codex CLIの認証で、ChatGPTの非公開Responses APIと画像APIをBunから呼ぶライブラリです。

Node.jsでは動きません。BunとCodex CLIが必要です。

```sh
# Codex CLIでログインする（~/.codex/auth.json に認証ファイルが保存される）
codex login
# ライブラリを導入する
bun add @ratetedev/chatgpt-auth-for-responses
```

```ts
import { homedir } from "node:os";
import { join } from "node:path";
import { createCodexAuth, createCodexImagesClient } from "@ratetedev/chatgpt-auth-for-responses";

const auth = createCodexAuth({ authFile: join(homedir(), ".codex", "auth.json") });
const images = createCodexImagesClient(auth);
const response = await images.generate({ prompt: "青空の下の猫" });
```

接続先はOpenAIの公開APIではなくChatGPTの非公開APIであるため、挙動が変わる可能性があります。

認証やAPIの制約は[Codex非公開APIスキル](https://github.com/RateteDev/chatgpt-auth-for-responses/blob/main/skills/codex-private-api/SKILL.md)で確認できます。画像を作るだけなら[@ratetedev/imagegen](https://www.npmjs.com/package/@ratetedev/imagegen)を使います。

## ライセンス

[MIT License](LICENSE)
