<p align="center">
  <br>
  <br>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/logo-light.svg">
    <img src="assets/logo-light.svg" alt="chatgpt-auth-for-responses のロゴ" width="400">
  </picture>
  <br>
</p>
<p align="center">
  <a href="https://bun.sh/"><img src="https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun&logoColor=black" alt="実行環境: Bun"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-2EA44F" alt="ライセンス: MIT"></a>
</p>
<p align="center">
  日本語 ・ <a href="docs/readme/README.en.md">English</a>
</p>
<br/>

# chatgpt-auth-for-responses

Codex CLIの認証で、ChatGPTの非公開APIをBunから使う。

- 🔑 Codex CLIの認証を利用
- 🖼️ `imagegen` で画像を生成・編集
- 🧩 Responses API・画像API向けライブラリ
- 🤖 エージェントスキルを2つ同梱

## 画像を作る

BunとCodex CLIが必要です。

```sh
# Codex CLIでログインする（~/.codex/auth.json に認証ファイルが保存される）
codex login
# 画像生成コマンドを導入する
bun add -g github:RateteDev/chatgpt-auth-for-responses
# 画像APIで画像を生成する（--output 未指定なら generated_images/ へ保存）
imagegen "青空の下の猫"
```

## ライブラリ

```sh
# Responses API・画像API向けライブラリを導入する
bun add github:RateteDev/chatgpt-auth-for-responses
```

認証やAPIの制約は[Codex非公開APIスキル](skills/codex-private-api/SKILL.md)で確認できます。

接続先はOpenAIの公開APIではなくChatGPTの非公開APIであるため、挙動が変わる可能性があります。

## スキル

使用するものをエージェントのスキル置き場へ配置してください。

<table>
  <tr>
    <td><a href="skills/imagegen/SKILL.md"><strong>imagegen</strong></a></td>
    <td>画像の生成・編集</td>
  </tr>
  <tr>
    <td><a href="skills/codex-private-api/SKILL.md"><strong>codex-private-api</strong></a></td>
    <td>認証とAPIの制約</td>
  </tr>
</table>

## ライセンス

[MIT License](LICENSE)
