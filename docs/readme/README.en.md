<p align="center">
  <br>
  <br>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../../assets/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="../../assets/logo-light.svg">
    <img src="../../assets/logo-light.svg" alt="chatgpt-auth-for-responses logo" width="400">
  </picture>
  <br>
</p>
<p align="center">
  <a href="https://bun.sh/"><img src="https://img.shields.io/badge/runtime-Bun-f9f1e1?logo=bun&logoColor=black" alt="Runtime: Bun"></a>
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/license-MIT-2EA44F" alt="License: MIT"></a>
</p>
<p align="center">
  <a href="../../README.md">日本語</a> ・ English
</p>
<br/>

# chatgpt-auth-for-responses

Use ChatGPT's private API from Bun with your Codex CLI authentication.

- 🔑 Reuse your Codex CLI authentication
- 🖼️ Generate and edit images with `imagegen`
- 🧩 Library for the Responses API and the image API
- 🤖 Bundles two agent skills

## Generate an image

You need Bun and the Codex CLI.

```sh
# Log in with the Codex CLI (saves the auth file to ~/.codex/auth.json)
codex login
# Install the image generation command
bun add -g github:RateteDev/chatgpt-auth-for-responses
# Generate an image with the image API (saved to generated_images/ unless --output is given)
imagegen "a cat under a blue sky"
```

## Library

```sh
# Install the library for the Responses API and the image API
bun add github:RateteDev/chatgpt-auth-for-responses
```

See the [Codex private API skill](../../skills/codex-private-api/SKILL.md) for authentication and API constraints.

The endpoint is not OpenAI's public API but ChatGPT's private API, so its behavior may change.

## Skills

Copy the skill you want to use into your agent's skill directory.

<table>
  <tr>
    <td><a href="../../skills/imagegen/SKILL.md"><strong>imagegen</strong></a></td>
    <td>generate and edit images</td>
  </tr>
  <tr>
    <td><a href="../../skills/codex-private-api/SKILL.md"><strong>codex-private-api</strong></a></td>
    <td>authentication and API constraints</td>
  </tr>
</table>

## License

[MIT License](../../LICENSE)
