# @ratetedev/imagegen

<a href="https://www.npmjs.com/package/@ratetedev/imagegen"><img src="https://img.shields.io/npm/v/@ratetedev/imagegen?color=CB3837&logo=npm" alt="バージョン: @ratetedev/imagegen"></a>

Codex CLIの認証で、ChatGPTの画像APIから画像を生成・編集するコマンドです。

Node.jsでは動きません。BunとCodex CLIが必要です。

```sh
# Codex CLIでログインする（~/.codex/auth.json に認証ファイルが保存される）
codex login
# 画像生成コマンドを導入する
bun add -g @ratetedev/imagegen
# 画像APIで画像を生成する（--output 未指定なら generated_images/ へ保存）
imagegen "青空の下の猫"
```

引数は `imagegen --help` で確認できます。

接続先はOpenAIの公開APIではなくChatGPTの非公開APIであるため、挙動が変わる可能性があります。

詳しくは[リポジトリのREADME](https://github.com/RateteDev/chatgpt-auth-for-responses#readme)を参照してください。

## ライセンス

[MIT License](LICENSE)
