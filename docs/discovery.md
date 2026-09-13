# Discovery — `$DSH_HOME/ide`

## Directory

```text
$DSH_HOME/ide/
  42381.lock
  51200.lock
```

- **Path**: `join(resolveDshHome(), 'ide')` — mirror harness [`dsh-home-paths`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/util/home-paths).
- **Create on activate** if missing (`mkdir` recursive).
- **One lock per Extension Host** (typically one VS Code window). Filename **`{port}.lock`** where `port` is the bound WS port.

## Lock file JSON

```json
{
  "protocolVersion": 1,
  "pid": 12345,
  "port": 42381,
  "workspaceFolders": ["C:\\Users\\alice\\my-app"],
  "ideId": "vscode",
  "ideName": "Visual Studio Code",
  "transport": "ws",
  "runningInWindows": true,
  "authToken": "00000000-0000-4000-8000-000000000001",
  "extensionVersion": "0.1.0",
  "sources": ["editor", "breakpoints", "debug-output", "terminal"]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `protocolVersion` | yes | WS schema version; currently `1` |
| `pid` | yes | Extension Host PID; consumers skip stale locks when process dead |
| `port` | yes | Redundant with filename; helps readers that do not parse filename |
| `workspaceFolders` | yes | Absolute paths; may be `[]` |
| `ideId` | yes | Stable IDE identifier (`vscode`, …) |
| `ideName` | yes | Display string from the host |
| `transport` | yes | Always `"ws"` for v1 |
| `runningInWindows` | optional | Hint for path semantics |
| `authToken` | yes | UUID; WS auth secret |
| `extensionVersion` | yes | semver of this extension |
| `sources` | yes | Enabled source ids (see [extensibility.md](extensibility.md)) |

## Write protocol

1. Bind WS server; obtain `port`.
2. Write to `{port}.lock.tmp` in the same directory.
3. `rename` → `{port}.lock` (atomic on same volume).

## Removal

On `deactivate()`:

1. Stop sources and WS.
2. `unlink` this instance’s lock (match port + pid in file before delete).

## Consumer algorithm (for dsh-ide-bridge)

```
for each *.lock in $DSH_HOME/ide/:
  parse JSON
  if pid not alive: skip (optional: delete stale)
  if workspaceFolders matches desired cwd: candidate
pick best candidate (single match, or newest mtime)
connect ws://127.0.0.1:{port}
send auth
```

Matching rule belongs on the DSH side; the extension only advertises folders.

## Claude Code compatibility

Claude’s observed lock (2026) omits explicit `port` in JSON (port only in filename) and omits `protocolVersion` / `sources`. DSH locks are **superset**. A DSH consumer must not assume Claude’s exact schema.

## Environment variables

| Variable | Effect |
|----------|--------|
| `DSH_HOME` | Root for `ide/` subdirectory |
| `DSH_IDE_LOCK_DIR` | Optional override for lock directory (debug only) |
| `DSH_IDE_WS_HOST` | Optional override; default `127.0.0.1` |

Production default remains loopback only.
