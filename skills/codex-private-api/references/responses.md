# Responses API

このライブラリが扱うのは認証です。Responses APIへのリクエストは呼び出し側で組み立てます。公開APIと入力の条件が異なるので、次の指定を含めてください。

```ts
const stream = await client.responses.create({
  model: "利用できるモデルのslug",
  instructions: "You are a helpful assistant.",
  input: [{ role: "user", content: [{ type: "input_text", text: "hello" }] }],
  stream: true,
  store: false,
});
```

- `input` は配列で渡します。文字列だけだと400になります。
- `stream: true` と `store: false` を指定します。省略すると400になります。
- `instructions` はリクエストのトップレベルに置きます。`input` 内で `system` や `developer` ロールを使うと400になります。
- 利用できるモデルは契約によって異なります。Codex CLIのモデル一覧で確認します。

会話履歴を送る場合は、過去の `assistant` メッセージの形式にも注意が必要です。[会話履歴の例](details/conversations.md) を参照してください。

400が返ったら、応答で指摘された項目と送信したリクエストを照らし合わせます。
