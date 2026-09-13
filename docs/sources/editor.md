# Source: `editor`

## Purpose

Expose which files the user is editing, which editor is active, and the current selection — the minimum context for “code-aware” dsh web.

## VS Code APIs

| API | Use |
|-----|-----|
| `window.onDidChangeActiveTextEditor` | Active file changes |
| `window.onDidChangeTextEditorSelection` | Selection range changes |
| `window.visibleTextEditors` | Split editors / visible tabs |
| `workspace.asRelativePath` | Workspace-relative paths when possible |
| `TextDocument.languageId`, `uri`, `version` | File metadata |

## Slice schema (`data`)

```json
{
  "activeFile": {
    "uri": "file:///c:/Users/alice/my-app/src/index.ts",
    "path": "C:\\Users\\alice\\my-app\\src\\index.ts",
    "relativePath": "src/index.ts",
    "languageId": "typescript",
    "version": 12,
    "isDirty": false
  },
  "selection": {
    "start": { "line": 10, "character": 4, "column": 5 },
    "end": { "line": 10, "character": 18, "column": 19 },
    "isEmpty": false,
    "text": "getSnapshot"
  },
  "visibleEditors": [
    {
      "uri": "file:///c:/Users/alice/my-app/src/index.ts",
      "relativePath": "src/index.ts",
      "languageId": "typescript",
      "viewColumn": 1
    }
  ]
}
```

| Field | When null |
|-------|-----------|
| `activeFile` | No text editor focused (e.g. settings UI) |
| `selection` | No active editor |
| `selection.text` | Omitted when selection empty or &gt; max chars |

`selection.start` / `selection.end`: `line` and `character` are **0-based** (VS Code `Position`); `column` is **1-based** (`character + 1`), matching the status bar.

## Limits

- **`selection.text`**: truncate to `dshIde.sources.editor.maxSelectionChars` (default 2048). Large selections are summarized by range only.
- **File content**: never included in v1; DSH reads files via its own tools if needed.
- **Untitled files**: `relativePath` may be `"Untitled-1"`; uri still set.

## Update frequency

- Push on active editor change immediately.
- Selection changes debounced 50ms to avoid flooding WS.

## Settings

| Key | Default |
|-----|---------|
| `dshIde.sources.editor.enabled` | `true` |
| `dshIde.sources.editor.maxSelectionChars` | `2048` |
| `dshIde.sources.editor.includeVisibleEditors` | `true` |

## Privacy

Selection text may contain secrets. DSH bridge should redact or omit before model context per product policy.

## Module layout

```text
src/sources/editor/
  editor-source.ts
  types.ts
  map-editor-state.ts   # pure mapping for tests
  index.ts
```
