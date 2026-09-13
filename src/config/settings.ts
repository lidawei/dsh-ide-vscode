import * as vscode from 'vscode';

import type { SourceId } from '../protocol/messages.js';
import type { LogLevel } from '../util/logger.js';

export interface EditorSourceConfig {
  enabled: boolean;
  maxSelectionChars: number;
}

export interface BreakpointsSourceConfig {
  enabled: boolean;
}

export interface ExtensionConfig {
  logLevel: LogLevel;
  editor: EditorSourceConfig;
  breakpoints: BreakpointsSourceConfig;
}

export function readExtensionConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration('dshIde');

  return {
    logLevel: config.get<LogLevel>('logLevel', 'info'),
    editor: {
      enabled: config.get<boolean>('sources.editor.enabled', true),
      maxSelectionChars: config.get<number>('sources.editor.maxSelectionChars', 2048),
    },
    breakpoints: {
      enabled: config.get<boolean>('sources.breakpoints.enabled', true),
    },
  };
}

export function isSourceEnabled(config: ExtensionConfig, sourceId: SourceId): boolean {
  switch (sourceId) {
    case 'editor':
      return config.editor.enabled;
    case 'breakpoints':
      return config.breakpoints.enabled;
    default:
      return false;
  }
}

export function getSourceConfig<T>(config: ExtensionConfig, sourceId: SourceId): T {
  switch (sourceId) {
    case 'editor':
      return config.editor as T;
    case 'breakpoints':
      return config.breakpoints as T;
    default:
      throw new Error(`Unknown source id: ${sourceId satisfies never}`);
  }
}
