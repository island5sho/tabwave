import { SessionStore } from '../storage/session-store';

export interface SweeperOptions {
  intervalMs?: number;
  onExpired?: (id: string, name: string) => void;
}

/**
 * Periodically scans the session store and removes sessions whose
 * `expiresAt` timestamp has passed.
 */
export class ExpireSweeper {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly store: SessionStore;
  private readonly intervalMs: number;
  private readonly onExpired: (id: string, name: string) => void;

  constructor(store: SessionStore, opts: SweeperOptions = {}) {
    this.store = store;
    this.intervalMs = opts.intervalMs ?? 60_000;
    this.onExpired = opts.onExpired ?? ((id, name) => console.log(`[expire-sweeper] Removed expired session "${name}" (${id})`));
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.sweep(), this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async sweep(): Promise<string[]> {
    const sessions = await this.store.list();
    const now = Date.now();
    const removed: string[] = [];

    for (const session of sessions) {
      if (!session.expiresAt) continue;
      const expiry = new Date(session.expiresAt).getTime();
      if (expiry <= now) {
        await this.store.delete(session.id);
        this.onExpired(session.id, session.name);
        removed.push(session.id);
      }
    }

    return removed;
  }
}
