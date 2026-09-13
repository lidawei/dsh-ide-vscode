# Design contracts

Implementation-facing contracts that mirror [`docs/`](../docs/README.md).

| Document | Purpose |
|----------|---------|
| [repository-layout.md](repository-layout.md) | Directory tree, dependency rules, naming |
| [source-contract.md](source-contract.md) | `IdeSource`, `SourceSlice`, snapshot types |

When changing the wire protocol, update **both** `docs/protocol.md` and `source-contract.md` in the same change.
