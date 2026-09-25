---
name: codex-private-api
description: Codex OAuthでChatGPTの非公開Responses APIや画像APIを使う連携を実装・調査するときに使う。認証、リクエスト制約、会話履歴、障害対応の知見を参照する。
---

# Codex非公開API

このリポジトリのライブラリを使ってCodexの非公開エンドポイントと連携するときの索引です。必要な項目だけ開いてください。記述と実装が食い違うときは、現在のソースコードと実際の応答を確認します。

| 調べたいこと | 読むファイル |
|---|---|
| 認証ファイル、トークン更新、ヘッダー | [references/authentication.md](references/authentication.md) |
| Responses API のリクエストと制限 | [references/responses.md](references/responses.md) |
| 画像の生成・編集API | [references/images.md](references/images.md) |
| 401やAPIエラーの切り分け | [references/troubleshooting.md](references/troubleshooting.md) |

Responses APIの会話履歴は `references/responses.md` から詳細へ進みます。既存画像を使うだけなら、別スキル `imagegen` を使ってください。

非公開エンドポイントの挙動は変わり得ます。認証ファイル、トークン、認証ヘッダーをログや会話へ出さず、調査時も必要なフィールドだけ確認してください。
