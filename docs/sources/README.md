# Per-source specifications

Each **source** is an independent perception module. Adding a capability = new folder under `src/sources/{id}/` + doc here + register in `registry.ts`.

| Source id | Doc | v1 default |
|-----------|-----|------------|
| `editor` | [editor.md](editor.md) | enabled |
| `breakpoints` | [breakpoints.md](breakpoints.md) | enabled |
| `debug-output` | [debug-output.md](debug-output.md) | disabled (opt-in) |
| `terminal` | [terminal.md](terminal.md) | disabled (opt-in) |

Extension model: [extensibility.md](../extensibility.md).
