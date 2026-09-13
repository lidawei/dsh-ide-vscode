# Source: `breakpoints`

## Purpose

List breakpoints and summarize the active debug session so DSH understands where execution may pause.

## VS Code APIs

| API | Use |
|-----|-----|
| `debug.breakpoints` | Current breakpoint set |
| `debug.onDidChangeBreakpoints` | Add/remove/change |
| `debug.activeDebugSession` | Running session |
| `debug.onDidStartDebugSession` / `onDidTerminateDebugSession` | Session lifecycle |
| `debug.onDidChangeActiveDebugSession` | Focused session |

## Slice schema (`data`)

```json
{
  "session": {
    "id": "abc123",
    "name": "Launch Program",
    "type": "node",
    "workspaceFolder": "C:\\Users\\alice\\my-app"
  },
  "breakpoints": [
    {
      "id": "1",
      "enabled": true,
      "uri": "file:///c:/Users/alice/my-app/src/index.ts",
      "relativePath": "src/index.ts",
      "line": 42,
      "condition": "x > 0",
      "hitCondition": null,
      "logMessage": null
    }
  ],
  "exceptionBreakpoints": [
    { "filter": "all", "enabled": true }
  ]
}
```

| Field | When null |
|-------|-----------|
| `session` | No active debug session |
| `condition` / `hitCondition` / `logMessage` | Unset on breakpoint |

## Breakpoint identity

Use VS Code’s internal breakpoint id when available (`SourceBreakpoint.id` or stable hash of uri+line+condition). Document mapping in implementation.

## Limits

- Workspace-scoped breakpoints only in v1 (filter by `workspaceFolders`).
- Function breakpoints and data breakpoints included when API exposes them.

## Update frequency

- Push on any `onDidChangeBreakpoints` or session lifecycle event.

## Settings

| Key | Default |
|-----|---------|
| `dshIde.sources.breakpoints.enabled` | `true` |

## Module layout

```text
src/sources/breakpoints/
  breakpoints-source.ts
  types.ts
  index.ts
```
