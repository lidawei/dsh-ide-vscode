# Extensibility — adding perception sources

## Mental model

A **source** is a module that:

1. Subscribes to VS Code APIs (or other local signals).
2. Maintains a typed **`SourceSlice<T>`** for its id.
3. Notifies the core when the slice changes.

The WS server and lock file never import VS Code API details — only source ids and JSON slices.

```text
         ┌─────────────────────────────────────┐
         │           SourceRegistry            │
         │  register(IdeSource) → ordered list │
         └─────────────────┬───────────────────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     ▼                     ▼                     ▼
 editor            breakpoints           (future: git)
 IdeSource         IdeSource             IdeSource
```

## `IdeSource` interface

Defined in `src/sources/types.ts` (see [source contract](../design/source-contract.md)).

```typescript
interface IdeSource<TData = unknown> {
  readonly id: SourceId;
  readonly displayName: string;

  /** Called once when extension activates. */
  start(ctx: SourceContext): void;

  /** Called on deactivate; dispose all subscriptions. */
  stop(): void;

  /** Current slice; safe to call anytime after start. */
  getSlice(): SourceSlice<TData>;
}
```

### `SourceContext`

| Member | Purpose |
|--------|---------|
| `vscode` | VS Code API namespace |
| `workspaceFolders` | Snapshot of folder list |
| `config` | Merged settings for this source |
| `emitChange()` | Notify registry (debounced internally) |
| `log` | Output channel logger |

## Registration

Central list in `src/sources/registry.ts`:

```typescript
export function createDefaultSources(): IdeSource[] {
  return [
    new EditorSource(),
    new BreakpointsSource(),
    new DebugOutputSource(),
    new TerminalSource(),
    // future: new GitSource(),
  ];
}
```

Feature flags filter the list before `SourceRegistry.start()`:

```typescript
const enabled = allSources.filter(s => config.isSourceEnabled(s.id));
```

Lock file `sources` array = enabled ids.

## Adding a new source (checklist)

1. **Pick id**: lowercase kebab, stable forever (`git`, `diagnostics`, `test-results`).
2. **Add** `src/sources/{id}/`:
   - `{id}-source.ts` — implements `IdeSource`
   - `types.ts` — `TData` interface
   - `index.ts` — re-export
3. **Register** in `registry.ts`.
4. **Document** `docs/sources/{id}.md` — API used, limits, sample slice JSON.
5. **Settings** — `dshIde.sources.{id}.enabled` default in `package.json` contributes.
6. **Tests** — unit test slice shaping with mocked VS Code events.

No changes required to:

- `WsServer` message types (uses generic `event` + `slice`)
- Lock schema (only `sources` string array grows)
- Protocol version (unless envelope changes)

## Configuration layering

```json
{
  "dshIde.sources.editor.enabled": true,
  "dshIde.sources.terminal.enabled": true,
  "dshIde.sources.terminal.maxBytes": 65536,
  "dshIde.sources.debug-output.maxLines": 500
}
```

Each source reads **`config.getSourceConfig(id)`**; defaults live next to the source module.

## Future source ideas

| Source id | VS Code / local API | Notes |
|-----------|---------------------|-------|
| `git` | `git.api` extension | Requires optional dependency declaration |
| `diagnostics` | `languages.onDidChangeDiagnostics` | Problems panel facts |
| `test-results` | Test Controller API | Failed tests at cursor |
| `symbols` | `executeDocumentSymbolProvider` | Heavy; snapshot on demand only |
| `code-actions` | `executeCodeActionProvider` | On-demand RPC from client |
| `file-watcher` | `createFileSystemWatcher` | Coarse change hints |

### On-demand vs streaming

| Pattern | Interface extension |
|---------|---------------------|
| Streaming | Default `IdeSource` + push events |
| On-demand | Optional `handleRequest(method, params)` on source; WS `rpc` message (protocol v2) |

v1 is streaming-only; design hooks for v2 RPC without breaking v1 clients.

## Versioning per source

- **`sourceRevision`**: bump when slice semantics change materially.
- Document breaking slice changes in `docs/sources/{id}.md` changelog section.
- DSH bridge should treat unknown `sourceRevision` as opaque.

## Testing strategy

- **Pure functions**: map VS Code events → `data` (no extension host).
- **Integration**: `@vscode/test-electron` with fixture workspace.
- **Protocol**: golden JSON files for snapshot/event payloads.

## Anti-patterns

| Avoid | Prefer |
|-------|--------|
| Giant `switch (sourceId)` in WS layer | Registry + typed sources |
| Shared mutable global snapshot | `SnapshotStore` with per-source writers |
| Hard-coded source list in lock writer | Derived from registry |
| Pushing full repo file contents | Paths + selections; DSH reads files via its own tools |
