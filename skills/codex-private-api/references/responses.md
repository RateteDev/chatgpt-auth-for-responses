# Responses API

このライブラリは認証情報を提供します。Responses APIへのリクエストは呼び出し側が組み立てます。OpenAIの公開APIと同じ入力が通るとは限りません。

```ts
const stream = await client.responses.create({
  model: "利用できるモデルのslug",
  instructions: "You are a helpful assistant.",
  input: [{ role: "user", content: [{ type: "input_text", text: "hello" }] }],
  stream: true,
  store: false,
});
```

- `input` は配列にします。文字列だけを渡すと400です。
- `stream: true` と `store: false` を指定します。どちらも省略時は400です。
- top-levelの `instructions` を指定します。`input` 内の `system`・`developer` ロールは使えません。
- 利用できるモデルは契約によって異なります。Codex CLIのモデル一覧で確認してください。
- 過去の `assistant` メッセージは `output_text` を使います。会話履歴の型と例は [details/conversations.md](details/conversations.md) を参照してください。

これらは非公開エンドポイントで観測された制約です。400を調べるときは、応答で示されたフィールドと実際のリクエストを突き合わせてください。
