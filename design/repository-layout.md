# Repository layout

## Top level

```text
dsh-ide-vscode/
├── README.md                 # Product entry, quick start
├── package.json              # VS Code extension manifest
├── tsconfig.json
├── esbuild.config.mjs        # Bundle extension host code
├── .vscodeignore
├── docs/                     # Design documentation (this tree)
├── design/                   # Implementation contracts (TypeScript shapes)
├── src/                      # Extension source
├── test/                     # Unit + integration tests
└── scripts/                  # Dev helpers (wscat smoke, lock inspect)
```

## `src/` layout

```text
src/
├── extension.ts              # activate / deactivate
├── controller/
│   └── extension-controller.ts
├── core/
│   ├── dsh-home-paths.ts     # Resolve $DSH_HOME/ide
│   ├── lock-registry.ts
│   ├── ws-server.ts
│   ├── snapshot-store.ts
│   └── source-registry.ts
├── protocol/
│   ├── messages.ts           # WS message types
│   └── snapshot.ts           # IdeSnapshot top-level types
├── sources/
│   ├── types.ts              # IdeSource, SourceSlice, SourceContext
│   ├── registry.ts           # createDefaultSources()
│   ├── editor/
│   ├── breakpoints/
│   ├── debug-output/
│   └── terminal/
├── config/
│   └── settings.ts           # Read dshIde.* configuration
└── util/
    ├── logger.ts
    └── debounce.ts
```

## Dependency direction

```text
extension.ts
  → controller
      → core (lock, ws, snapshot, source-registry)
      → sources/*  (must NOT import from each other)
      → protocol, config, util
```

Sources depend on `sources/types.ts` and `util` only. Cross-source composition is forbidden; merge happens in `SnapshotStore`.

## `docs/` vs `design/`

| Directory | Audience | Content |
|-----------|----------|---------|
| `docs/` | Humans, product, bridge authors | Architecture, protocol, roadmap |
| `design/` | Implementers | TypeScript contracts mirroring protocol |

Keep protocol field names aligned between `docs/protocol.md` and `design/source-contract.ts`.

## `test/` layout

```text
test/
├── unit/
│   ├── snapshot-store.test.ts
│   └── sources/
│       └── editor/map-editor-state.test.ts
├── fixtures/
│   └── snapshots/
│       └── editor-basic.json
└── integration/
    └── ws-handshake.test.ts  # optional; @vscode/test-electron
```

## Build outputs

```text
dist/
  extension.js    # single bundle for extension host
```

No separate webview bundle in v1.

## Related repositories

| Repo | Role |
|------|------|
| **dsh-ide-vscode** (this) | WS server + lock writer |
| **dsh-ide-bridge-app** | DSH plugin + bundle (future) |
| **deepseek-harness** | dsh web, session, agent loop |

## Naming conventions

- Source ids: `kebab-case` matching directory name.
- Settings: `dshIde.sources.{id}.{key}`.
- Lock / protocol: `camelCase` JSON fields.
