import type { ExtensionConfig } from '../config/settings.js';
import { getSourceConfig, isSourceEnabled } from '../config/settings.js';
import type { SourceId, SourceSlice } from '../protocol/messages.js';
import type { Logger } from '../util/logger.js';

import type { SnapshotStore } from './snapshot-store.js';

import type { IdeSource, SourceContext } from '../sources/types.js';

export interface SourceRegistryOptions {
  config: ExtensionConfig;
  log: Logger;
  snapshotStore: SnapshotStore;
  workspaceFolders: string[];
  onSliceChanged: (sourceId: SourceId, slice: SourceSlice) => void;
}

export class SourceRegistry {
  private readonly sources: IdeSource[] = [];
  private started = false;

  constructor(private readonly options: SourceRegistryOptions) {}

  register(source: IdeSource): void {
    this.sources.push(source);
  }

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    const ctx: SourceContext = {
      log: this.options.log,
      workspaceFolders: this.options.workspaceFolders,
      getSourceConfig: <T>(sourceId: SourceId) =>
        getSourceConfig<T>(this.options.config, sourceId),
      emitChange: (sourceId: SourceId) => {
        const source = this.sources.find((s) => s.id === sourceId);
        if (!source) {
          return;
        }
        const slice = source.getSlice();
        this.options.snapshotStore.replaceSlice(sourceId, slice);
        this.options.onSliceChanged(sourceId, slice);
      },
    };

    for (const source of this.sources) {
      if (!isSourceEnabled(this.options.config, source.id)) {
        this.options.snapshotStore.replaceSlice(source.id, {
          status: 'disabled',
          sourceRevision: '0',
          updatedAt: new Date().toISOString(),
          data: {},
        });
        continue;
      }

      try {
        source.start(ctx);
        this.options.snapshotStore.replaceSlice(source.id, source.getSlice());
      } catch (err) {
        this.options.log.error(`Source ${source.id} failed to start: ${String(err)}`);
        this.options.snapshotStore.replaceSlice(source.id, {
          status: 'error',
          sourceRevision: '0',
          updatedAt: new Date().toISOString(),
          data: {},
          error: {
            code: 'START_FAILED',
            message: String(err),
          },
        });
      }
    }
  }

  stop(): void {
    for (const source of [...this.sources].reverse()) {
      try {
        source.stop();
      } catch (err) {
        this.options.log.error(`Source ${source.id} failed to stop: ${String(err)}`);
      }
    }
    this.started = false;
  }

  listSourceIds(): SourceId[] {
    return this.sources
      .filter((source) => isSourceEnabled(this.options.config, source.id))
      .map((source) => source.id);
  }

  getSnapshot() {
    return this.options.snapshotStore.getSnapshot();
  }
}
