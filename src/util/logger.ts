import type { OutputChannel } from 'vscode';

export type LogLevel = 'off' | 'info' | 'debug';

export interface Logger {
  info(message: string): void;
  debug(message: string): void;
  error(message: string): void;
}

export function createLogger(channel: OutputChannel, level: LogLevel): Logger {
  return {
    info(message: string) {
      if (level === 'off') {
        return;
      }
      channel.appendLine(`[info] ${message}`);
    },
    debug(message: string) {
      if (level !== 'debug') {
        return;
      }
      channel.appendLine(`[debug] ${message}`);
    },
    error(message: string) {
      if (level === 'off') {
        return;
      }
      channel.appendLine(`[error] ${message}`);
    },
  };
}
