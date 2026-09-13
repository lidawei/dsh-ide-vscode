# Source: `terminal`

## Purpose

Tail **integrated terminal** output written after the extension starts. Same partial capture model as debug output.

## VS Code APIs

| API | Use |
|-----|-----|
| `window.onDidOpenTerminal` | Track terminals |
| `window.onDidCloseTerminal` | Remove from map |
| `window.onDidChangeActiveTerminal` | Mark active terminal |
| `window.onDidWriteTerminalData` | Capture writes (requires proposed / stable API per VS Code version) |

Check minimum VS Code engine version in `package.json` for `onDidWriteTerminalData` availability.

## Slice schema (`data`)

```json
{
  "activeTerminal": {
    "name": "bash",
    "creationOptions": { "shellPath": "C:\\Program Files\\Git\\bin\\bash.exe" }
  },
  "terminals": [
    {
      "name": "bash",
      "isActive": true,
      "tail": "pnpm test\n PASS  …\n"
    }
  ]
}
```

| Field | Notes |
|-------|-------|
| `tail` | Last N bytes per terminal (ring buffer) |
| `activeTerminal` | null if none focused |

## Capability bounds

| Scenario | Behavior |
|----------|----------|
| Output before activate | Not captured |
| External terminal | Out of scope (not integrated terminal) |
| Secret echo | May contain tokens; DSH should treat as sensitive |

## Limits

| Setting | Default |
|---------|---------|
| `dshIde.sources.terminal.maxBytesPerTerminal` | `32768` |
| `dshIde.sources.terminal.maxTerminals` | `8` |

## Update frequency

- Coalesce writes 100ms per terminal before `emitChange`.

## Settings

| Key | Default |
|-----|---------|
| `dshIde.sources.terminal.enabled` | `false` (opt-in) |

## Module layout

```text
src/sources/terminal/
  terminal-source.ts
  ring-buffer.ts
  types.ts
  index.ts
```
