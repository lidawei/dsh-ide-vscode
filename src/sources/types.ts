import type { SourceId } from '../protocol/messages.js';
import type { Logger } from '../util/logger.js';

export interface SourceContext {
  readonly log: Logger;
  readonly workspaceFolders: readonly string[];
  getSourceConfig<T>(sourceId: SourceId): T;
  emitChange(sourceId: SourceId): void;
}

export interface IdeSource<TData = unknown> {
  readonly id: SourceId;
  readonly displayName: string;
  start(ctx: SourceContext): void;
  stop(): void;
  getSlice(): import('../protocol/messages.js').SourceSlice<TData>;
}
