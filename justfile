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

# Check that each packed npm tarball omits tests and resolves workspace: dependencies
[group('Quality')]
pack-check:
    #!/usr/bin/env bash
    set -euo pipefail
    tmp="$(mktemp -d)"
    trap 'rm -rf "$tmp"' EXIT
    status=0
    for dir in packages/*/; do
        (cd "$dir" && bun pm pack --destination "$tmp" >/dev/null)
    done
    for tgz in "$tmp"/*.tgz; do
        if tar -tzf "$tgz" | grep -Eq '(^|/)(tests?/|[^/]*\.test\.[cm]?[jt]s$)'; then
            echo "error: $(basename "$tgz") contains test files" >&2
            status=1
        fi
        if tar -xzOf "$tgz" package/package.json | grep -q '"workspace:'; then
            echo "error: $(basename "$tgz") still has a workspace: dependency" >&2
            status=1
        fi
    done
    exit "$status"

# Run the package CI (install from the lockfile, then check, pack-check and test)
[group('Quality')]
ci:
    bun install --frozen-lockfile
    just check
    just pack-check
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
