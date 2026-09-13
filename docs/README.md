# Documentation index

Read in this order when implementing or extending the extension.

| Document | Contents |
|----------|----------|
| [overview.md](overview.md) | Goals, non-goals, Claude-style discovery, consumers |
| [architecture.md](architecture.md) | Runtime components and data flow |
| [discovery.md](discovery.md) | `$DSH_HOME/ide/{port}.lock` format and lifecycle |
| [protocol.md](protocol.md) | WebSocket auth, envelopes, snapshot schema, versioning |
| [extensibility.md](extensibility.md) | **Source provider** model for new perception capabilities |
| [roadmap.md](roadmap.md) | v1 / v2 / v3 delivery slices |

### Per-source specifications (v1)

| Source | Spec |
|--------|------|
| Active file & selection | [sources/editor.md](sources/editor.md) |
| Breakpoints | [sources/breakpoints.md](sources/breakpoints.md) |
| Debug console (live capture) | [sources/debug-output.md](sources/debug-output.md) |
| Integrated terminal (tail buffer) | [sources/terminal.md](sources/terminal.md) |

### Implementation layout (planned)

| Document | Contents |
|----------|----------|
| [../design/repository-layout.md](../design/repository-layout.md) | Directory tree and module boundaries |
| [../design/source-contract.md](../design/source-contract.md) | TypeScript-facing contracts (reference only) |
