import * as vscode from 'vscode';

import type { SourceSlice } from '../../protocol/messages.js';
import type { IdeSource, SourceContext } from '../types.js';

import type { BreakpointEntry, BreakpointsSourceData, DebugSessionSummary } from './types.js';

function mapBreakpoint(
  bp: vscode.Breakpoint,
  workspaceFolders: readonly string[],
): BreakpointEntry {
  if (bp instanceof vscode.SourceBreakpoint) {
    const location = bp.location;
    const uri = location.uri.toString();
    const relativePath = workspaceFolders.length
      ? vscode.workspace.asRelativePath(location.uri, false)
      : location.uri.fsPath;

    return {
      id: String(location.uri.toString()) + ':' + String(location.range.start.line),
      enabled: bp.enabled,
      uri,
      relativePath,
      line: location.range.start.line + 1,
      condition: bp.condition ?? undefined,
      hitCondition: bp.hitCondition ?? undefined,
      logMessage: bp.logMessage ?? undefined,
    };
  }

  return {
    id: `bp-${String(bp.enabled)}`,
    enabled: bp.enabled,
    uri: null,
    relativePath: null,
    line: null,
  };
}

function mapSession(session: vscode.DebugSession): DebugSessionSummary {
  return {
    id: session.id,
    name: session.name,
    type: session.type,
    workspaceFolder: session.workspaceFolder?.uri.fsPath ?? null,
  };
}

export class BreakpointsSource implements IdeSource<BreakpointsSourceData> {
  readonly id = 'breakpoints' as const;
  readonly displayName = 'Breakpoints';

  private revision = 0;
  private data: BreakpointsSourceData = { session: null, breakpoints: [] };
  private ctx: SourceContext | undefined;
  private disposables: vscode.Disposable[] = [];

  start(ctx: SourceContext): void {
    this.ctx = ctx;
    this.refresh();

    this.disposables.push(
      vscode.debug.onDidChangeBreakpoints(() => this.refresh()),
      vscode.debug.onDidStartDebugSession(() => this.refresh()),
      vscode.debug.onDidTerminateDebugSession(() => this.refresh()),
      vscode.debug.onDidChangeActiveDebugSession(() => this.refresh()),
    );
  }

  stop(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
    this.ctx = undefined;
  }

  getSlice(): SourceSlice<BreakpointsSourceData> {
    return {
      status: 'ok',
      sourceRevision: String(this.revision),
      updatedAt: new Date().toISOString(),
      data: this.data,
    };
  }

  private refresh(): void {
    if (!this.ctx) {
      return;
    }

    this.revision += 1;
    const session = vscode.debug.activeDebugSession;
    this.data = {
      session: session ? mapSession(session) : null,
      breakpoints: vscode.debug.breakpoints.map((bp) =>
        mapBreakpoint(bp, this.ctx!.workspaceFolders),
      ),
    };
    this.ctx.emitChange(this.id);
  }
}
