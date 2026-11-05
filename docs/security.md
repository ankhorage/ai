# AI permissions and trust boundaries

- `init` and `sync` never run project scripts, model prompts, MCP servers or remote package installers.
- AI-created agent commands are fingerprinted; conflicting user edits refuse updates rather than being overwritten.
- All MCP changes start with a read-only preview and require `--approve`. No access tokens are stored in project metadata. Only clean HTTPS URLs are accepted.
- BMAD installation executes upstream npm code only after explicit user approval and inside an interactive terminal.
- Plan, review and discussion use a read-only provider mode where verified. Implementation/fix is limited to the current workspace and requires explicit approval and a feature branch.
- `ship` validates first, requires a conventional title and issue number for PR creation, and does not merge the PR.
- Generated provider-specific files are not equivalent to confirmed platform capability. `ankh ai doctor` reports missing agents and drift.
- Sensitive local plans, reviews, runs and backups are ignored by Git. Export only inspected, scrubbed artifacts for collaboration.
- Root `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` and shared Ankhorage skills remain managed by Devtools.

Remote MCP servers and external plugin installers can read or modify information using their granted permissions. Inspect the source, permissions and vendor-specific controls before enabling any integration.
