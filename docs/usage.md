# Architecture

`@ankhorage/ai` owns project-local AI configuration, agent capability adapters, safe installation previews, and plan/review workflow artifacts.

- `@ankhorage/ankh` owns root command routing.
- `@ankhorage/devtools` owns the canonical `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and shared skills. AI never overwrites these.
- `@ankhorage/project-detector` provides read-only project evidence.
- Agent-specific files are generated only when selected and only if absent or still AI-managed.
- Planning and review remain grounded in a real installed agent CLI. A missing executable results in an error, not a simulated success.
- No remote plugins, MCP executables, or package installation runs implicitly.

Phased delivery deliberately separates agent setup from agent execution and shipping. Any integration that cannot be verified is reported as unavailable.


Detailed user-facing commands are documented in the source package and `ankh ai cheatsheet`.
