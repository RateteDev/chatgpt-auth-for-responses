# chatgpt-auth-for-responses

## 起きていた問題

自作のアシスタントアプリやCodex CLI以外のエージェントハーネスから、従量課金のAPIを契約せずにChatGPTのResponses API互換エンドポイントを呼べることに気づいた。
ただしCodex CLIの認証を借りる必要があり、認証の解決とトークン更新を利用側ごとに作り直すのは手間だった。
Codex CLI同梱の画像生成は画像生成モデルを直接指定できず必ずLLMを介するため、プロンプトを狙いどおりに制御できなかった。
同時実行数にも制限があり、デザイン案を並べて比較する用途で困った。

## 解決するための方針

非公開エンドポイントを扱うラッパーを、認証の解決・トークン更新・Responses APIと画像APIの呼び出しを持つライブラリ`@ratetedev/chatgpt-auth-for-responses`と、それを使う`@ratetedev/imagegen` CLIの2パッケージにまとめ、npmレジストリで公開する。
CLIと同梱スキルを通じて、Codex CLI以外のハーネスからも同じ機能を使えるようにする。
非公開APIに依存する値は`packages/chatgpt-auth-for-responses/src/constants.ts`とスキル文書へ集約し、上流の変更へ追随する箇所を1つに絞る。

## このリポジトリでの前提

利用者にBunとCodex CLIが必要で、認証は`codex login`が作る`~/.codex/auth.json`を読む。
APIの利用料はOpenAIの従量課金ではなく、利用者のChatGPTサブスクリプションの利用枠で賄う。
接続先はOpenAIの公開APIではなくChatGPTの非公開APIであり、予告なく挙動が変わりうる。
パッケージはTypeScriptのソースをそのまま公開し、ビルド工程を持たない。Node.jsでは動かない。

## インフラ・運用に関するコンテキスト

| 構成要素 | 状態 | 正となる定義 |
|---|---|---|
| 認証ファイル | `codex login`が作成・更新する | `~/.codex/auth.json` |
| 非公開APIの接続先・ヘッダー・モデル名 | ライブラリが使用する | `packages/chatgpt-auth-for-responses/src/constants.ts` |
| 配布チャネル | npmレジストリの`@ratetedev`スコープ | 各`packages/*/package.json` |

## 常時遵守するべき制約

| 規則 | 理由 |
|---|---|
| 認証ファイル・トークン・認証ヘッダーの値を、ログ・コミット・会話へ出力しない。 | 漏洩を防ぐため。 |
| 非公開APIに依存する値は`packages/chatgpt-auth-for-responses/src/constants.ts`に集約し、他の箇所へ複製しない。 | 上流の変更時に追随箇所を1つに保つため。 |
| 非公開APIへ依存することをREADMEと同梱スキルに明記し続ける。 | 利用者が公開APIと誤認しないため。 |
| 同梱スキルの記述と実装の挙動を乖離させない。 | エージェントが古い手順でAPIを呼ぶのを防ぐため。 |
| `imagegen`に認証・トークン更新・API呼び出しを実装せず、`@ratetedev/chatgpt-auth-for-responses`を使う。 | 非公開APIへの依存を1つのパッケージに保つため。 |
