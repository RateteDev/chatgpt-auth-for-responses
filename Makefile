.PHONY: help test lint format format-check typecheck ci install

# Show this help.
help:
	@printf "Usage: make <target>\n\n"
	@awk '\
		BEGIN { desc_count = 0; } \
		/^# [^#]/ { \
			descs[++desc_count] = substr($$0, 3); \
			next; \
		} \
		/^[a-zA-Z0-9_.-]+:/ { \
			target = $$0; \
			sub(/:.*/, "", target); \
			if (target != ".PHONY" && desc_count > 0) { \
				printf "%-20s %s\n", target, descs[1]; \
				for (i = 2; i <= desc_count; i++) { \
					printf "%-20s %s\n", "", descs[i]; \
				} \
				printf "\n"; \
			} \
			desc_count = 0; \
			delete descs; \
			next; \
		} \
		{ desc_count = 0; delete descs; } \
	' $(MAKEFILE_LIST)

# Run all tests.
test:
	bun test

# Run lint check.
lint:
	bunx biome check .

# Apply formatter and auto-fixes.
format:
	bunx biome check --write .

# Check formatting without modifying files.
format-check:
	@bunx biome format . >/dev/null || { printf "warning: format issues detected. run 'make format' to fix.\n" >&2; exit 1; }

# Run TypeScript type check.
typecheck:
	bunx tsc --noEmit

# Run typecheck, lint, and tests.
ci: typecheck lint test

# Install dependencies.
install:
	bun install
