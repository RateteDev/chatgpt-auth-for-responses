---
name: codex-private-api
description: Codexの認証を使ってChatGPTの非公開Responses APIや画像APIと連携する際に使う。認証、入力制約、会話履歴、エラー対応を調べられる。
---

# Codex非公開API

このリポジトリのライブラリを使ってAPI連携を作るときは、必要な項目から読んでください。

| 知りたいこと | 参照先 |
|---|---|
| 認証ファイル、トークン、ヘッダー | [認証](references/authentication.md) |
| Responses APIの入力と制約 | [Responses API](references/responses.md) |
| 画像の生成・編集 | [画像API](references/images.md) |
| 401や400などのエラー | [エラー対応](references/troubleshooting.md) |

会話履歴の詳しい例はResponses APIのページからたどれます。画像を作るだけなら、`imagegen` スキルを使います。

APIの挙動が記述と違うときは、ソースコードと実際の応答を確認してください。認証ファイル、トークン、認証ヘッダーはログや会話に出さず、調査に必要な項目だけ見ます。
