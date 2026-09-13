export interface EditorFile {
  uri: string;
  path: string;
  relativePath: string;
  languageId: string;
  version?: number;
  isDirty?: boolean;
  viewColumn?: number;
}

/** Cursor / selection position. `line` and `character` are 0-based (VS Code); `column` is 1-based. */
export interface EditorPosition {
  line: number;
  character: number;
  column: number;
}

export interface EditorSelection {
  start: EditorPosition;
  end: EditorPosition;
  isEmpty: boolean;
  text?: string;
}

export interface EditorSourceData {
  activeFile: EditorFile | null;
  selection: EditorSelection | null;
  visibleEditors: EditorFile[];
}
