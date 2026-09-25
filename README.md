# chatgpt-auth-for-responses

Codex CLIの認証を使ってChatGPTの非公開Responses APIと画像APIに接続するBun向けライブラリです。APIの挙動や連携時の注意点は、用途に応じて次のスキルを参照してください。

- [Codex非公開API](skills/codex-private-api/SKILL.md)：認証、Responses API、画像API、障害対応。
- [画像生成](skills/imagegen/SKILL.md)：`imagegen` CLIによる新規生成と参照画像を使った編集。

ライブラリは `bun add github:RateteDev/chatgpt-auth-for-responses`、CLIは `bun add -g github:RateteDev/chatgpt-auth-for-responses` で導入します。認証には `codex --login` が生成する `~/.codex/auth.json` を使います。

スキルは標準的な `SKILL.md` と参照ファイルです。利用するエージェントのスキルディレクトリへ、必要なスキルのフォルダごと配置してください。GitHubのアーカイブから取得でき、git cloneは不要です。OpenCodeではグローバルの `~/.config/opencode/skills/`、またはプロジェクトの `.opencode/skills/` に配置できます。

このAPIは非公開で、予告なく挙動が変わることがあります。
