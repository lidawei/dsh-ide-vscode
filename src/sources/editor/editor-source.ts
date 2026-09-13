import * as vscode from 'vscode';

import type { EditorSourceConfig } from '../../config/settings.js';
import type { SourceSlice } from '../../protocol/messages.js';
import { debounce } from '../../util/debounce.js';
import type { IdeSource, SourceContext } from '../types.js';

import type { EditorFile, EditorSelection, EditorSourceData } from './types.js';

export function mapTextEditor(
  editor: vscode.TextEditor,
  workspaceFolders: readonly string[],
): EditorFile {
  const uri = editor.document.uri.toString();
  const fsPath = editor.document.uri.fsPath;
  const relativePath = workspaceFolders.length
    ? vscode.workspace.asRelativePath(editor.document.uri, false)
    : fsPath;

  return {
    uri,
    path: fsPath,
    relativePath,
    languageId: editor.document.languageId,
    version: editor.document.version,
    isDirty: editor.document.isDirty,
    viewColumn: editor.viewColumn ?? undefined,
  };
}

export function mapSelection(
  editor: vscode.TextEditor,
  maxSelectionChars: number,
): EditorSelection {
  const selection = editor.selection;
  const isEmpty = selection.isEmpty;
  const mapped: EditorSelection = {
    start: {
      line: selection.start.line,
      character: selection.start.character,
      column: selection.start.character + 1,
    },
    end: {
      line: selection.end.line,
      character: selection.end.character,
      column: selection.end.character + 1,
    },
    isEmpty,
  };

  if (!isEmpty) {
    const text = editor.document.getText(selection);
    if (text.length <= maxSelectionChars) {
      mapped.text = text;
    }
  }

  return mapped;
}

export function buildEditorSourceData(
  workspaceFolders: readonly string[],
  maxSelectionChars: number,
): EditorSourceData {
  const active = vscode.window.activeTextEditor;
  const visibleEditors = vscode.window.visibleTextEditors.map((editor) =>
    mapTextEditor(editor, workspaceFolders),
  );

  return {
    activeFile: active ? mapTextEditor(active, workspaceFolders) : null,
    selection: active ? mapSelection(active, maxSelectionChars) : null,
    visibleEditors,
  };
}

export function createEditorSlice(
  data: EditorSourceData,
  sourceRevision: string,
): SourceSlice<EditorSourceData> {
  return {
    status: 'ok',
    sourceRevision,
    updatedAt: new Date().toISOString(),
    data,
  };
}

export class EditorSource implements IdeSource<EditorSourceData> {
  readonly id = 'editor' as const;
  readonly displayName = 'Editor';

  private revision = 0;
  private data: EditorSourceData = {
    activeFile: null,
    selection: null,
    visibleEditors: [],
  };
  private ctx: SourceContext | undefined;
  private disposables: vscode.Disposable[] = [];
  private debouncedSelectionRefresh: (() => void) & { cancel(): void } | undefined;

  start(ctx: SourceContext): void {
    this.ctx = ctx;
    const config = ctx.getSourceConfig<EditorSourceConfig>(this.id);
    this.debouncedSelectionRefresh = debounce(() => {
      this.refresh(config.maxSelectionChars);
    }, 50);
    this.refresh(config.maxSelectionChars);

    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.refresh(config.maxSelectionChars);
      }),
      vscode.window.onDidChangeTextEditorSelection(() => {
        this.debouncedSelectionRefresh?.();
      }),
      vscode.window.onDidChangeVisibleTextEditors(() => {
        this.refresh(config.maxSelectionChars);
      }),
    );
  }

  stop(): void {
    this.debouncedSelectionRefresh?.cancel();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
    this.ctx = undefined;
  }

  getSlice(): SourceSlice<EditorSourceData> {
    return createEditorSlice(this.data, String(this.revision));
  }

  private refresh(maxSelectionChars: number): void {
    if (!this.ctx) {
      return;
    }
    this.revision += 1;
    this.data = buildEditorSourceData(this.ctx.workspaceFolders, maxSelectionChars);
    this.ctx.emitChange(this.id);
  }
}
