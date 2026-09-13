import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/** Resolve DSH home directory (`$DSH_HOME` or `~/.dsh`). */
export function resolveDshHome(): string {
  const fromEnv = process.env.DSH_HOME?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  return path.join(os.homedir(), '.dsh');
}

/** Resolve IDE lock directory (`$DSH_IDE_LOCK_DIR` or `$DSH_HOME/ide`). */
export function resolveIdeLockDir(): string {
  const override = process.env.DSH_IDE_LOCK_DIR?.trim();
  if (override) {
    return path.resolve(override);
  }
  return path.join(resolveDshHome(), 'ide');
}

/** Ensure directory exists; throws if creation fails. */
export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}
