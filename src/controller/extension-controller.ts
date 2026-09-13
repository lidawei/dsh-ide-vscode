import * as crypto from 'node:crypto';
import * as os from 'node:os';

import * as vscode from 'vscode';

import { readExtensionConfig } from '../config/settings.js';
import { resolveIdeLockDir } from '../core/dsh-home-paths.js';
import { LockRegistry } from '../core/lock-registry.js';
import { SnapshotStore } from '../core/snapshot-store.js';
import { SourceRegistry } from '../core/source-registry.js';
import { WsServer } from '../core/ws-server.js';
import { PROTOCOL_VERSION } from '../protocol/messages.js';
import { createDefaultSources } from '../sources/registry.js';
import { createLogger } from '../util/logger.js';

const EXTENSION_VERSION = '0.1.0';
const WS_HOST = process.env.DSH_IDE_WS_HOST?.trim() || '127.0.0.1';

export class ExtensionController {
  private outputChannel: vscode.OutputChannel | undefined;
  private snapshotStore: SnapshotStore | undefined;
  private wsServer: WsServer | undefined;
  private lockRegistry: LockRegistry | undefined;
  private sourceRegistry: SourceRegistry | undefined;
  private authToken: string | undefined;
  private port = 0;

  async activate(context: vscode.ExtensionContext): Promise<void> {
    const config = readExtensionConfig();
    this.outputChannel = vscode.window.createOutputChannel('DSH IDE Bridge');
    const log = createLogger(this.outputChannel, config.logLevel);

    const workspaceFolders =
      vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ?? [];

    this.authToken = crypto.randomUUID();
    this.snapshotStore = new SnapshotStore();
    this.snapshotStore.setWorkspaceFolders(workspaceFolders);

    this.sourceRegistry = new SourceRegistry({
      config,
      log,
      snapshotStore: this.snapshotStore,
      workspaceFolders,
      onSliceChanged: (sourceId, slice) => {
        const revision = this.snapshotStore!.revision;
        this.wsServer?.broadcast({
          type: 'event',
          revision,
          sourceId,
          sourceRevision: slice.sourceRevision,
          slice,
        });
      },
    });

    for (const source of createDefaultSources()) {
      this.sourceRegistry.register(source);
    }

    this.sourceRegistry.start();

const IDE_ID = 'vscode';

    this.wsServer = new WsServer({
      host: WS_HOST,
      authToken: this.authToken,
      extensionVersion: EXTENSION_VERSION,
      ideId: IDE_ID,
      ideName: vscode.env.appName,
      sources: this.sourceRegistry.listSourceIds(),
      log,
      getSnapshot: () => ({
        revision: this.snapshotStore!.revision,
        snapshot: this.snapshotStore!.getSnapshot(),
      }),
    });

    this.port = await this.wsServer.start();

    this.lockRegistry = new LockRegistry(resolveIdeLockDir(), log);
    this.lockRegistry.write({
      protocolVersion: PROTOCOL_VERSION,
      pid: process.pid,
      port: this.port,
      workspaceFolders,
      ideId: IDE_ID,
      ideName: vscode.env.appName,
      transport: 'ws',
      runningInWindows: os.platform() === 'win32',
      authToken: this.authToken,
      extensionVersion: EXTENSION_VERSION,
      sources: this.sourceRegistry.listSourceIds(),
    });

    context.subscriptions.push(
      vscode.commands.registerCommand('dshIde.showStatus', () => {
        const lockDir = resolveIdeLockDir();
        void vscode.window.showInformationMessage(
          `DSH IDE Bridge: ws://${WS_HOST}:${this.port}  lock: ${lockDir}\\${this.port}.lock`,
        );
      }),
      this.outputChannel,
      { dispose: () => this.deactivate() },
    );

    log.info(`Activated on ws://${WS_HOST}:${this.port}`);
  }

  async deactivate(): Promise<void> {
    this.sourceRegistry?.stop();
    this.lockRegistry?.remove();
    await this.wsServer?.stop();

    this.sourceRegistry = undefined;
    this.lockRegistry = undefined;
    this.wsServer = undefined;
    this.snapshotStore = undefined;
    this.authToken = undefined;
    this.port = 0;
  }
}
