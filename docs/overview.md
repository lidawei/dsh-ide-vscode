# Overview

## Problem

Users run **dsh web** in a browser while editing in **VS Code**. The browser session has no visibility into the active editor, selection, debug state, or terminal output unless something bridges IDE facts to DSH.

## Solution (this extension)

1. VS Code extension starts a **loopback WebSocket server**.
2. Extension writes a **discovery lock file** under `$DSH_HOME/ide/{port}.lock` (same discovery pattern as Claude Code’s `~/.claude/ide/`).
3. **DSH Host plugin**（仓 `dsh-ide-bridge-app/packages/ide-bridge`）扫描 lock 目录，用 `authToken` 连 WS，消费 **snapshot** / **event**。
4. **dsh web** 由 Client 插件（`.../client-ui-ide-bridge`）经 Remote 显示 IDE 状态；扩展不直接连浏览器。

```text
┌─────────────────────┐     lock + WS      ┌──────────────────────────────────────┐
│  dsh-ide-vscode     │ ◄───────────────── │  dsh-ide-bridge-app (sibling repo)   │
│  (this repo)        │   127.0.0.1 only   │  ide-bridge (Host) + client-ui + app │
└──────────┬──────────┘                    └──────────┬─────────────────────────────┘
           │                                          │
    VS Code API                               dsh web UI (composer.dock)
```

该 monorepo **拆三个 npm 包**（Host / Client / Bundle patch）是 DSH 插件惯例，见 sibling 仓根 `README.md` 与各 `packages/*/README.md`。

## Goals

- **Discoverable**: any local DSH process can find the IDE bridge without hard-coded ports.
- **Secure by default**: loopback bind, random port, per-session `authToken`, no LAN exposure.
- **Extensible**: new IDE facts are new **sources**, not changes to the WS core.
- **Honest capability bounds**: document what VS Code APIs can and cannot read (especially console output).

## Non-goals (this repo)

- Implementing DSH plugins, web UI, or session logging.
- Replacing the separate [vscode profile sidecar](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/arch/vscode-profile-design.md) design (IDE-native chat). The two routes can coexist.
- Pushing IDE context into the model on every cursor move (DSH side should snapshot on **send**, not stream each keystroke into the session log).

## Consumers

| Consumer | How it connects |
|----------|-----------------|
| **dsh-ide-bridge**（`dsh-ide-bridge-app/packages/ide-bridge`） | Read `*.lock`, `ws://127.0.0.1:{port}`, auth, `hello`（`ideId` / `ideName`）, subscribe |
| **dsh-client-ui-ide-bridge** | Host Remote `getContext`；自行 `$mount`，slot `conversation.composer.dock` |
| **Manual debugging** | `wscat`, `scripts/ws_client.py` |
| **Future IDEs** | 各自扩展写 lock + 稳定 `ideId`；同一 WS 协议 |

## Discovery home

| Product | IDE bridge directory |
|---------|----------------------|
| Claude Code | `~/.claude/ide/` |
| DSH | `$DSH_HOME/ide/` (default `~/.dsh/ide/`) |

Resolve `$DSH_HOME` the same way as harness: explicit config, then env `DSH_HOME`, then `~/.dsh`. The extension must not assume the harness repo checkout path.

## Versioning

- **`protocolVersion`** in the lock file and WS `hello` message (integer, starts at `1`).
- **`sourceRevision`** per source id in snapshots (monotonic string or integer per source module).
- Breaking WS changes bump `protocolVersion`; additive source fields do not.
