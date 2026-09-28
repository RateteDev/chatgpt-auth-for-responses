# 会話履歴を送る

会話履歴では、過去の `user` メッセージに `input_text`、過去の `assistant` メッセージに `output_text` を使います。`assistant` に `input_text` を渡すと400になります。

`assistant` メッセージには、SDKの `ResponseOutputMessage` 型に合わせて `id`、`status`、`type` も付けます。

```ts
const stream = await client.responses.create({
  model: "利用できるモデルのslug",
  instructions: "You are a helpful assistant.",
  input: [
    { role: "user", content: [{ type: "input_text", text: "My name is Alice" }] },
    {
      type: "message",
      id: "msg_prev_0",
      role: "assistant",
      status: "completed",
      content: [{ type: "output_text", text: "Nice to meet you, Alice!", annotations: [] }],
    },
    { role: "user", content: [{ type: "input_text", text: "What is my name?" }] },
  ],
  stream: true,
  store: false,
});
```
