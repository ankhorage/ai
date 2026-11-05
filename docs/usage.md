# Ankhorage AI usage

Install the published package in the target repository once available, then use the Ankh command router:

```sh
bun add -D @ankhorage/ai
ankh ai init
ankh ai init --dry-run --agents codex,claude-code
ankh ai init --yes --agents codex,claude-code --workflow standard
ankh ai sync --dry-run
ankh ai sync
ankh ai doctor
ankh ai status --json
ankh ai agents
ankh ai cheatsheet --format markdown
```

The initial wizard reads evidence from `@ankhorage/project-detector`, asks which agents and methodology to configure, previews generated files, and writes only after confirmation. `init --yes` is permission for project setup, **not** permission to edit the project with an AI agent. Existing user-modified files cause conflicts rather than silent overwrites. Use `ankh ai rollback` for the most recent AI-managed setup batch.

## Planning and delivery

```sh
ankh ai plan "Implement a new module"
ankh ai execute <plan-uuid> --approve
ankh ai review
ankh ai fix --approve
ankh ai ship
ankh ai ship --approve --issue 123 --title "feat(ai): deliver module"
```

Planning and reviewing use read-only agent CLI invocations. Execute and fix require a non-main work branch; approval is explicit. Plans and reviews are saved under `.ankh/ai` and sensitive runtime evidence is gitignored. `ship` runs Bun quality checks and then optionally creates a GitHub PR; it never merges or closes PRs without a separate delivery operation. CI checks after a PR remains GitHub-owned.

Headless workflow execution has tested adapter wiring for Codex and Claude Code; their installation, authentication and actual runtime versions must be checked on the user's machine. Cursor and Gemini receive native commands/skills, but their headless workflow execution is reported as unsupported until verified.

## Integrations

```sh
ankh ai mcp
ankh ai mcp add docs https://example.com/mcp
ankh ai mcp add docs https://example.com/mcp --approve
ankh ai plugins
ankh ai plugins install claude-code reviewer@official
ankh ai plugins install claude-code reviewer@official --approve
ankh ai plugins install gemini https://github.com/owner/extension --approve
ankh ai hooks
ankh ai hooks enable
ankh ai hooks enable --approve
ankh ai skills
ankh ai bmad status
ankh ai bmad install --approve
ankh ai bmad party
```

MCP registration is preview-first, accepts only credential-free HTTPS endpoints, and merges supported provider-native config files. Plugin installation delegates to the native Claude/Gemini CLIs and may download third-party code; inspect and trust the source before using `--approve`. The hooks command registers a generated, verified SessionStart guidance script for Claude/Gemini while preserving existing hooks. Other hook formats remain explicitly unsupported.

BMAD v6.12 is opt-in. `ankh ai bmad party` explains how to start the genuine upstream Party Mode within a supported AI client; it is not a fake local multi-agent implementation. `ankh ai discuss` is a single-model multi-perspective read-only session in the standard workflow.

Repository `AGENTS.md`, its equivalent symlinks, and standard Ankhorage skills remain owned by `@ankhorage/devtools`. Run `ankh devtools sync` to provision those prerequisites when absent. User-specific secrets do not belong in `.ankh/ai.yaml` or committed provider settings.

## Release

The package is bootstrapped in the repository, but publishing it globally requires a separately configured npm trusted-publishing identity and versioned release process. Until these exist, run the built standalone `bun dist/cli/bin.js` for local verification.
