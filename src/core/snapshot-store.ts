import type { IdeSnapshot, SourceId, SourceSlice } from '../protocol/messages.js';

export class SnapshotStore {
  private _revision = 0;
  private readonly slices = new Map<SourceId, SourceSlice>();
  private workspaceFolders: string[] = [];

  get revision(): number {
    return this._revision;
  }

  setWorkspaceFolders(folders: string[]): void {
    this.workspaceFolders = [...folders];
  }

  replaceSlice(sourceId: SourceId, slice: SourceSlice): void {
    this.slices.set(sourceId, slice);
    this._revision += 1;
  }

  getSnapshot(): IdeSnapshot {
    const sources: IdeSnapshot['sources'] = {};
    for (const [id, slice] of this.slices) {
      sources[id] = slice;
    }

    return {
      capturedAt: new Date().toISOString(),
      workspaceFolders: [...this.workspaceFolders],
      sources,
    };
  }
}
