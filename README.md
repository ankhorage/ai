# @ankhorage/ai

Universal, provider-aware agentic development setup and workflow CLI for Ankhorage projects.

> Initial repository bootstrap documentation. Release-owned Paradox generation replaces this file in the managed release workflow.

## Start

```sh
bun add -D @ankhorage/ai
ankh ai init
ankh ai doctor
ankh ai cheatsheet
```

Alternatively run `bunx @ankhorage/ai` through its standalone `ankhorage-ai` binary.

See [architecture](docs/architecture.md) and [user guide](docs/usage.md).

**Safety:** setup is preview-first and only manages its own files. Agent execution is opt-in. Hooks, plugins and MCP servers require explicit trusted configuration and are never silently installed.
