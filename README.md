# dsh-ide-vscode

VS Code extension that exposes a **loopback WebSocket** and writes **discovery lock files** under `$DSH_HOME/ide/`, so the sibling repo **dsh-ide-bridge-app** (Host + Web Client + bundle patch) can connect and let **dsh web** show IDE context.

This repository includes a **v0.1 MVP** implementation plus design docs under [`docs/`](docs/README.md).

## Scope (this repo)

| In scope | Out of scope |
|----------|----------------|
| WS server on `127.0.0.1` | DSH Host plugin / dsh web UI |
| `$DSH_HOME/ide/{port}.lock` discovery | Spawning `dsh` or vscode profile sidecar |
| Editor, selection, breakpoints (v1) | Model prompt injection (DSH side) |
| `ideId` / `ideName` in lock + WS `hello` | DSH 三件套源码（在 sibling 仓） |
| Terminal tail + debug output capture (v1, limited) | Reading full Debug Console history |

## Sibling repo（DSH 插件 monorepo）

与扩展配套的是 **`dsh-ide-bridge-app`**（与 `dsh-ide-vscode` 并列，不在本仓）：

| 目录 | 包 | 面 |
|------|-----|-----|
| `packages/ide-bridge` | `@deepseek-ai/dsh-ide-bridge` | Host |
| `packages/client-ui-ide-bridge` | `@deepseek-ai/dsh-client-ui-ide-bridge` | Web Client |
| `packages/ide-bridge-app` | `@deepseek-ai/dsh-ide-bridge-app` | Bundle patch |

各目录有 `README.md`；总览见该仓根 `README.md`。

## Related harness docs

- [IDE bridge + web path](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/arch/vscode-profile-design.md) — parallel **vscode profile** route (IDE-native UI); this repo is the **web + IDE bridge** route.
- DSH home: `~/.dsh` via `$DSH_HOME` ([`dsh-home-paths`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/util/home-paths)).

## Manual test (Python)

1. **F5** in VS Code to launch Extension Development Host (or install the built VSIX).
2. Open a folder and edit files in the Extension Development Host window.
3. Run the WebSocket client:

```powershell
pip install websockets
python scripts/ws_client.py
```

The script reads the newest `$DSH_HOME/ide/*.lock`, connects, authenticates, and prints `hello`, `snapshot`, and live `event` messages.

Optional flags:

```powershell
python scripts/ws_client.py --port 42381
python scripts/ws_client.py --lock "$env:USERPROFILE\.dsh\ide\42381.lock"
```

Command palette: **DSH IDE: Show Bridge Status** shows the current WS URL and lock path.

## Build

```powershell
pnpm install
pnpm run build
pnpm run typecheck
```

## Architecture (summary)

```text
VS Code APIs  →  sources/* (IdeSource)  →  SnapshotStore  →  WsServer
                      ↑                           │
                 SourceRegistry                    └──→  $DSH_HOME/ide/{port}.lock
```

New perception capabilities (git, diagnostics, test results, …) plug in as **sources** without changing the transport layer. See [extensibility.md](docs/extensibility.md).

## Documentation

| Start here | |
|------------|--|
| Index | [`docs/README.md`](docs/README.md) |
| Big picture | [`docs/overview.md`](docs/overview.md) |
| Add a source | [`docs/extensibility.md`](docs/extensibility.md) |
| Wire format | [`docs/protocol.md`](docs/protocol.md) |
| Code layout | [`design/repository-layout.md`](design/repository-layout.md) |
