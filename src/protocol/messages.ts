export const PROTOCOL_VERSION = 1;

export type SourceId = 'editor' | 'breakpoints';

export type SourceStatus = 'ok' | 'degraded' | 'disabled' | 'error';

export interface SourceSlice<TData = unknown> {
  status: SourceStatus;
  sourceRevision: string;
  updatedAt: string;
  data: TData;
  error?: {
    code: string;
    message: string;
  };
}

export interface IdeSnapshot {
  capturedAt: string;
  workspaceFolders: string[];
  sources: Partial<Record<SourceId, SourceSlice>>;
}

export type ClientInboundMessage =
  | { type: 'auth'; token: string }
  | { type: 'getSnapshot'; requestId?: string };

export type ServerOutboundMessage =
  | {
      type: 'hello';
      protocolVersion: typeof PROTOCOL_VERSION;
      extensionVersion: string;
      sources: SourceId[];
      /** Stable IDE identifier for multi-IDE clients (e.g. `vscode`). */
      ideId: string;
      /** Human-readable IDE name from the host (e.g. `Visual Studio Code`). */
      ideName: string;
    }
  | {
      type: 'snapshot';
      revision: number;
      snapshot: IdeSnapshot;
      requestId?: string;
    }
  | {
      type: 'event';
      revision: number;
      sourceId: SourceId;
      sourceRevision: string;
      slice: SourceSlice;
    }
  | { type: 'error'; code: string; message: string };

export interface LockFilePayload {
  protocolVersion: typeof PROTOCOL_VERSION;
  pid: number;
  port: number;
  workspaceFolders: string[];
  /** Stable IDE identifier for multi-IDE discovery (e.g. `vscode`). */
  ideId: string;
  ideName: string;
  transport: 'ws';
  runningInWindows: boolean;
  authToken: string;
  extensionVersion: string;
  sources: SourceId[];
}
