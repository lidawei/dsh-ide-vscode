import { WebSocketServer, type WebSocket } from 'ws';

import type {
  ClientInboundMessage,
  IdeSnapshot,
  ServerOutboundMessage,
  SourceId,
} from '../protocol/messages.js';
import { PROTOCOL_VERSION } from '../protocol/messages.js';
import type { Logger } from '../util/logger.js';

const AUTH_TIMEOUT_MS = 5_000;
const MAX_CONNECTIONS = 4;
const CLOSE_AUTH_FAILED = 4401;
const CLOSE_TOO_MANY = 4403;

export interface WsServerOptions {
  host: string;
  authToken: string;
  extensionVersion: string;
  ideId: string;
  ideName: string;
  sources: SourceId[];
  log: Logger;
  getSnapshot: () => { revision: number; snapshot: IdeSnapshot };
}

export class WsServer {
  private server: WebSocketServer | undefined;
  private port = 0;
  private readonly clients = new Set<WebSocket>();

  constructor(private readonly options: WsServerOptions) {}

  async start(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = new WebSocketServer({ host: this.options.host, port: 0 }, () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
          reject(new Error('Failed to bind WebSocket server'));
          return;
        }
        this.port = address.port;
        this.server = server;
        this.options.log.info(`WebSocket listening on ${this.options.host}:${this.port}`);
        resolve(this.port);
      });

      server.on('connection', (socket) => {
        this.handleConnection(socket);
      });

      server.on('error', (err) => {
        this.options.log.error(`WebSocket server error: ${String(err)}`);
        reject(err);
      });
    });
  }

  getPort(): number {
    return this.port;
  }

  broadcast(message: ServerOutboundMessage): void {
    const payload = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  }

  async stop(): Promise<void> {
    for (const client of this.clients) {
      client.close(1000);
    }
    this.clients.clear();

    if (!this.server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.server!.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
    this.server = undefined;
    this.port = 0;
  }

  private handleConnection(socket: WebSocket): void {
    if (this.clients.size >= MAX_CONNECTIONS) {
      socket.close(CLOSE_TOO_MANY, 'Too many connections');
      return;
    }

    let authed = false;
    const authTimer = setTimeout(() => {
      if (!authed) {
        socket.close(CLOSE_AUTH_FAILED, 'Auth timeout');
      }
    }, AUTH_TIMEOUT_MS);

    socket.on('message', (data) => {
      let parsed: ClientInboundMessage;
      try {
        parsed = JSON.parse(String(data)) as ClientInboundMessage;
      } catch {
        this.send(socket, { type: 'error', code: 'INVALID_JSON', message: 'Message must be JSON' });
        return;
      }

      if (!authed) {
        if (parsed.type !== 'auth') {
          socket.close(CLOSE_AUTH_FAILED, 'First message must be auth');
          return;
        }
        if (parsed.token !== this.options.authToken) {
          socket.close(CLOSE_AUTH_FAILED, 'Invalid token');
          return;
        }

        authed = true;
        clearTimeout(authTimer);
        this.clients.add(socket);
        this.sendHelloAndSnapshot(socket);
        return;
      }

      if (parsed.type === 'getSnapshot') {
        const { revision, snapshot } = this.options.getSnapshot();
        this.send(socket, {
          type: 'snapshot',
          revision,
          snapshot,
          requestId: parsed.requestId,
        });
        return;
      }

      this.send(socket, {
        type: 'error',
        code: 'UNKNOWN_MESSAGE',
        message: `Unrecognized type: ${(parsed as { type?: string }).type ?? 'unknown'}`,
      });
    });

    socket.on('close', () => {
      clearTimeout(authTimer);
      this.clients.delete(socket);
    });
  }

  private sendHelloAndSnapshot(socket: WebSocket): void {
    this.send(socket, {
      type: 'hello',
      protocolVersion: PROTOCOL_VERSION,
      extensionVersion: this.options.extensionVersion,
      sources: this.options.sources,
      ideId: this.options.ideId,
      ideName: this.options.ideName,
    });

    const { revision, snapshot } = this.options.getSnapshot();
    this.send(socket, { type: 'snapshot', revision, snapshot });
  }

  private send(socket: WebSocket, message: ServerOutboundMessage): void {
    socket.send(JSON.stringify(message));
  }
}
