export interface EditorFile {
  uri: string;
  path: string;
  relativePath: string;
  languageId: string;
  version?: number;
  isDirty?: boolean;
  viewColumn?: number;
}

export interface EditorSelection {
  start: { line: number; character: number };
  end: { line: number; character: number };
  isEmpty: boolean;
  text?: string;
}

export interface EditorSourceData {
  activeFile: EditorFile | null;
  selection: EditorSelection | null;
  visibleEditors: EditorFile[];
}
