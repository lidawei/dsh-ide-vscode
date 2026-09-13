import * as fs from 'node:fs';
import * as path from 'node:path';

import type { LockFilePayload } from '../protocol/messages.js';
import type { Logger } from '../util/logger.js';

import { ensureDir } from './dsh-home-paths.js';

export class LockRegistry {
  private lockPath: string | undefined;

  constructor(
    private readonly lockDir: string,
    private readonly log: Logger,
  ) {}

  write(payload: LockFilePayload): void {
    ensureDir(this.lockDir);
    const filename = `${payload.port}.lock`;
    const finalPath = path.join(this.lockDir, filename);
    const tempPath = `${finalPath}.tmp`;

    fs.writeFileSync(tempPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    fs.renameSync(tempPath, finalPath);
    this.lockPath = finalPath;
    this.log.info(`Wrote lock file ${finalPath}`);
  }

  remove(): void {
    if (!this.lockPath) {
      return;
    }

    try {
      if (fs.existsSync(this.lockPath)) {
        fs.unlinkSync(this.lockPath);
        this.log.info(`Removed lock file ${this.lockPath}`);
      }
    } catch (err) {
      this.log.error(`Failed to remove lock file: ${String(err)}`);
    } finally {
      this.lockPath = undefined;
    }
  }
}
