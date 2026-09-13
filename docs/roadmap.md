# Roadmap

## Phase 0 — Design (current)

- [x] Repo layout and doc index
- [x] Architecture, discovery, protocol, extensibility
- [x] Per-source capability notes
- [ ] Review with dsh-ide-bridge-app design (companion repo)

## Phase 1 — Extension MVP

**Goal**: Local WS + lock; editor + breakpoints; manual client test.

| Item | Deliverable |
|------|-------------|
| Scaffold | `package.json`, `tsconfig`, esbuild bundle |
| Core | `ExtensionController`, `LockRegistry`, `WsServer`, `SnapshotStore` |
| Sources | `editor`, `breakpoints` |
| Settings | Enable/disable per source, output channel logging |
| QA | `wscat` script, sample lock in dev doc |

**Exit criteria**:

- Lock appears under `$DSH_HOME/ide/` on activate.
- Auth + hello + snapshot over WS.
- Changing active editor pushes `event`.

## Phase 2 — Partial perception

**Goal**: Terminal tail + debug output with honest degradation.

| Item | Notes |
|------|-------|
| `terminal` source | Ring buffer from `onDidWriteTerminalData` |
| `debug-output` source | `DebugAdapterTracker` while session active |
| Status `degraded` | When no debug session, document empty buffer |
| Throttle | Coalesce rapid terminal writes (100ms) |

## Phase 3 — dsh-ide-bridge-app (separate repo)

**Goal**: DSH web shows IDE panel; send attaches snapshot to session.

| Item | Owner repo |
|------|------------|
| Lock scanner + WS client | `dsh-ide-bridge-app` |
| Host plugin | same |
| Web UI card | harness client or bridge bundle |
| Session event | `ide.context` or similar (harness ADR) |

**Exit criteria**:

- User opens dsh web + VS Code; sidebar shows active file.
- On send, model-visible context includes IDE snapshot (policy TBD).

## Phase 4 — Hardening

- Stale lock GC
- Multi-window selection UX on DSH side
- Optional `rpc` for on-demand sources (symbols, git diff)
- Marketplace publish (`dsh-ide-vscode`)

## Phase 5 — Additional sources (extension-only)

Priority order (adjust with product):

1. `diagnostics` — errors in active file
2. `git` — branch, dirty files (requires Git extension)
3. `test-results` — failing tests in workspace

Each phase = one source module + doc + settings default off until stable.

## Out of scope / alternate track

The harness [vscode profile design](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/arch/vscode-profile-design.md) (sidecar + native chat) remains a **parallel** integration. This roadmap does not replace it.

## Open decisions

| Topic | Options | Recommendation |
|-------|---------|----------------|
| Session event shape | New `SessionEventMap` member vs attachment metadata | Harness team; must be model-visible ⟺ logged |
| Snapshot on send vs live stream | Full snapshot only at send | Snapshot at send; WS for live UI only |
| Default enabled sources | All on vs editor only | Editor + breakpoints on; terminal/debug opt-in |
| Protocol v2 RPC | Separate message type | Defer until on-demand source needed |
