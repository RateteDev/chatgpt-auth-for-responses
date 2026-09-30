set shell := ["bash", "-euo", "pipefail", "-c"]

# ─── Setup & Clean ───

# Install dependencies and configure local environment (run once after clone)
[group('Setup & Clean')]
setup:
    git config core.hooksPath .githooks
    git config core.quotepath false
    bun install

# Remove installed dependencies and generated build artifacts
[group('Setup & Clean')]
clean:
    rm -rf node_modules packages/*/node_modules dist coverage

# ─── Quality ───

# Run lint, format, and type checks without modifying files
[group('Quality')]
check:
    bunx biome check .
    bunx tsc --noEmit

# Auto-fix lint and format issues
[group('Quality')]
fix:
    bunx biome check --write .

# Run unit tests
[group('Quality')]
test:
    bun test

# Run the package CI (install from the lockfile, then check and test)
[group('Quality')]
ci:
    bun install --frozen-lockfile
    just check
    just test

# ─── CI ───

# Check that every file under assets/ is referenced from the docs
[group('CI')]
repo-checks:
    #!/usr/bin/env bash
    set -euo pipefail
    status=0
    for path in assets/*; do
        name="$(basename "$path")"
        if ! grep -rqF "$name" README.md docs skills; then
            echo "error: $path is not referenced from README.md, docs, or skills" >&2
            status=1
        fi
    done
    exit "$status"

# Run local CI (mirrors remote CI pipeline)
[group('CI')]
ci-local:
    just repo-checks
    just _check-hooks-configured
    just ci

[private]
_check-hooks-configured:
    @test "$(git config --get core.hooksPath)" = ".githooks" || { echo "core.hooksPath is not '.githooks' — run 'just setup'"; exit 1; }
