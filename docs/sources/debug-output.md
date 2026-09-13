# Source: `debug-output`

## Purpose

Capture **Debug Console** and debug-adapter traffic while a session runs. This is inherently **partial**: VS Code does not expose a historical read API for the debug console.

## VS Code APIs

| API | Use |
|-----|-----|
| `debug.registerDebugAdapterTrackerFactory` | Intercept DAP messages |
| `DebugAdapterTracker.onDidSendMessage` / `onDidReceiveMessage` | Output events, stdout/stderr events |
| Session lifecycle | Clear or mark buffer inactive when session ends |

## Slice schema (`data`)

```json
{
  "sessionId": "abc123",
  "captureActive": true,
  "lines": [
    { "at": "2026-09-06T04:45:01.000Z", "kind": "stdout", "text": "Server listening on 3000\n" },
    { "at": "2026-09-06T04:45:02.000Z", "kind": "stderr", "text": "Warning: …\n" },
    { "at": "2026-09-06T04:45:03.000Z", "kind": "console", "text": "evaluate: 42\n" }
  ]
}
```

| Field | Meaning |
|-------|---------|
| `captureActive` | `true` only while tracker attached to active session |
| `lines` | Newest at end; ring buffer capped |
| `kind` | `stdout` \| `stderr` \| `console` \| `dap` (optional verbose) |

## Capability bounds

| Scenario | Behavior |
|----------|----------|
| Before extension enabled | **No backfill** — buffer empty |
| After debug session ends | Keep last N lines; set `captureActive: false`, `status: degraded` |
| User clears debug console | VS Code may not emit event; buffer may be stale until next line |

Document this clearly in dsh web UI: “Debug output from extension start / current session only.”

## Limits

| Setting | Default |
|---------|---------|
| `dshIde.sources.debug-output.maxLines` | `500` |
| `dshIde.sources.debug-output.maxLineChars` | `4096` |

## Update frequency

- Append lines → debounced push 100ms.
- Full slice replaced on each event (small buffer).

## Settings

| Key | Default |
|-----|---------|
| `dshIde.sources.debug-output.enabled` | `false` (opt-in) |
| `dshIde.sources.debug-output.includeDap` | `false` |

## Module layout

```text
src/sources/debug-output/
  debug-output-source.ts
  debug-tracker-factory.ts
  ring-buffer.ts
  types.ts
  index.ts
```
