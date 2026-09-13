import { BreakpointsSource } from './breakpoints/index.js';
import { EditorSource } from './editor/index.js';
import type { IdeSource } from './types.js';

export function createDefaultSources(): IdeSource[] {
  return [new EditorSource(), new BreakpointsSource()];
}
