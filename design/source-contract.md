# Source contract (TypeScript)

Types below are the implementation contract for `src/sources/`. JSON on the wire uses the same field names unless noted.

## Identifiers

```typescript
/** Stable source id; appears in lock, hello, and snapshot.sources keys. */
type SourceId =
  | 'editor'
  | 'breakpoints'
  | 'debug-output'
  | 'terminal';
  // | 'git'  — add here when implemented

type SourceStatus = 'ok' | 'degraded' | 'disabled' | 'error';
```

## Envelope

Every slice on the wire includes:

```typescript
interface SourceSlice<TData = unknown> {
  status: SourceStatus;
  sourceRevision: string;
  updatedAt: string; // ISO-8601 UTC
  data: TData;
  error?: {
    code: string;
    message: string;
  };
}
```

## Top-level snapshot

```typescript
interface IdeSnapshot {
  capturedAt: string;
  workspaceFolders: string[];
  sources: Partial<Record<SourceId, SourceSlice>>;
}
```

`Partial` reflects disabled or failed sources omitted or present with `status: 'disabled' | 'error'`.

## Source interface

```typescript
interface SourceContext {
  readonly log: Logger;
  readonly workspaceFolders: readonly string[];
  getSourceConfig<T>(sourceId: SourceId): T;
  emitChange(): void;
}

interface IdeSource<TData = unknown> {
  readonly id: SourceId;
  readonly displayName: string;

  start(ctx: SourceContext): void;
  stop(): void;
  getSlice(): SourceSlice<TData>;
}
```

### Lifecycle rules

1. `start` registers VS Code disposables; store in module-level or instance array.
2. `stop` disposes all; idempotent.
3. `getSlice` must return a **new object** or frozen snapshot (no live mutation after return).
4. Call `ctx.emitChange()` after updating internal state (registry debounces).

## Registry

```typescript
interface SourceRegistry {
  register(source: IdeSource): void;
  start(ctx: SourceContext): void;
  stop(): void;
  getSnapshot(): IdeSnapshot;
  listSourceIds(): SourceId[];
}
```

## Snapshot store

```typescript
interface SnapshotStore {
  revision: number;
  replaceSlice(sourceId: SourceId, slice: SourceSlice): void;
  getSnapshot(): IdeSnapshot;
}
```

- Only the owning source (via registry) writes its slice.
- `revision` increments on every `replaceSlice`.

## WS broadcast (internal)

```typescript
type ServerOutboundMessage =
  | { type: 'hello'; protocolVersion: 1; extensionVersion: string; sources: SourceId[] }
  | { type: 'snapshot'; revision: number; snapshot: IdeSnapshot; requestId?: string }
  | { type: 'event'; revision: number; sourceId: SourceId; sourceRevision: string; slice: SourceSlice }
  | { type: 'error'; code: string; message: string };
```

## Editor data (reference)

```typescript
interface EditorSourceData {
  activeFile: EditorFile | null;
  selection: EditorSelection | null;
  visibleEditors: EditorFile[];
}

interface EditorFile {
  uri: string;
  path: string;
  relativePath: string;
  languageId: string;
  version?: number;
  isDirty?: boolean;
  viewColumn?: number;
}

interface EditorPosition {
  line: number; // 0-based
  character: number; // 0-based
  column: number; // 1-based
}

interface EditorSelection {
  start: EditorPosition;
  end: EditorPosition;
  isEmpty: boolean;
  text?: string;
}
```

Other source `data` types live in `src/sources/{id}/types.ts` and are documented in `docs/sources/{id}.md`.

## Future: on-demand RPC (protocol v2 sketch)

```typescript
interface IdeSourceWithRpc<TData> extends IdeSource<TData> {
  handleRequest?(method: string, params: unknown): Promise<unknown>;
}
```

Not implemented in v1; registry ignores optional method until WS adds `rpc` message type.

## Error codes (source-level)

| Code | Meaning |
|------|---------|
| `API_UNAVAILABLE` | VS Code API missing (old engine) |
| `START_FAILED` | Exception in `start()` |
| `CAPABILITY_OFF` | User disabled feature |

Wire as `slice.status = 'error'` with `error.code`.
