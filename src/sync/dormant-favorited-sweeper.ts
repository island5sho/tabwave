import { SessionStore } from '../storage/session-store';

export interface DormantFavoritedSweeperOptions {
  store: SessionStore;
  onWake?: (sessionId: string) => void;
}

/**
 * Sweeper that automatically wakes dormant sessions that are marked as favorited.
 * Intended to be run on a schedule to ensure favorited sessions stay active.
 */
export class DormantFavoritedSweeper {
  private store: SessionStore;
  private onWake?: (sessionId: string) => void;
  private timer: NodeJS.Timeout | null = null;

  constructor(options: DormantFavoritedSweeperOptions) {
    this.store = options.store;
    this.onWake = options.onWake;
  }

  async sweep(): Promise<string[]> {
    const sessions = await this.store.getAll();
    const woken: string[] = [];

    for (const session of sessions) {
      if (session.dormant && session.favorite) {
        await this.store.update(session.id, {
          dormant: false,
          updatedAt: new Date().toISOString(),
        });
        woken.push(session.id);
        this.onWake?.(session.id);
      }
    }

    return woken;
  }

  start(intervalMs: number = 60_000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.sweep().catch((err) =>
        console.error('[DormantFavoritedSweeper] sweep error:', err.message)
      );
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
