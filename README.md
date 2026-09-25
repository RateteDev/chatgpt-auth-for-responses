# chatgpt-auth-for-responses

Codex CLIの認証を使い、ChatGPTの非公開Responses APIと画像APIに接続するBun向けライブラリです。画像生成用の `imagegen` コマンドも含みます。

使いたい機能に合わせて、スキルを選んでください。

- [画像生成](skills/imagegen/SKILL.md)：画像を作る・手元の画像を参考に作り直す。
- [Codex非公開API](skills/codex-private-api/SKILL.md)：認証やAPIの挙動を調べ、連携を実装する。

ライブラリを使う場合は `bun add github:RateteDev/chatgpt-auth-for-responses`、画像生成コマンドを使う場合は `bun add -g github:RateteDev/chatgpt-auth-for-responses` で導入します。認証ファイルは `codex --login` で用意します。

スキルはGitHubのアーカイブから取得し、使うものをフォルダごとエージェントのスキル置き場へ配置できます。OpenCodeなら `~/.config/opencode/skills/` またはプロジェクトの `.opencode/skills/` が配置先です。git cloneは必要ありません。

接続先は非公開APIのため、挙動が変わる可能性があります。
