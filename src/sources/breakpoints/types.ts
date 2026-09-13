export interface BreakpointEntry {
  id: string;
  enabled: boolean;
  uri: string | null;
  relativePath: string | null;
  line: number | null;
  condition?: string;
  hitCondition?: string;
  logMessage?: string;
}

export interface DebugSessionSummary {
  id: string;
  name: string;
  type: string;
  workspaceFolder: string | null;
}

export interface BreakpointsSourceData {
  session: DebugSessionSummary | null;
  breakpoints: BreakpointEntry[];
}
