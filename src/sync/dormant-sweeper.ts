import { SessionStore } from '../storage/session-store';

export interface DormantSweeperOptions {
  thresholdDays?: number;
  intervalMs?: number;
  onWake?: (sessionId: string) => void;
}

const DEFAULT_THRESHOLD_DAYS = 7;
const DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export class DormantSweeper {
  private timer: ReturnType<typeof setInterval> | null = null;
  private thresholdMs: number;
  private intervalMs: number;
  private onWake?: (sessionId: string) => void;

  constructor(private store: SessionStore, opts: DormantSweeperOptions = {}) {
    this.thresholdMs =
      (opts.thresholdDays ?? DEFAULT_THRESHOLD_DAYS) * 24 * 60 * 60 * 1000;
    this.intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
    this.onWake = opts.onWake;
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
    const sessions = await this.store.getAll();
    const now = Date.now();
    const woken: string[] = [];

    for (const session of sessions) {
      if (session.locked || session.protected || !session.dormant) continue;

      const lastActive = session.updatedAt
        ? new Date(session.updatedAt).getTime()
        : new Date(session.createdAt).getTime();

      if (now - lastActive > this.thresholdMs) {
        const updated = {
          ...session,
          dormant: false,
          updatedAt: new Date().toISOString(),
        };
        await this.store.save(updated);
        woken.push(session.id);
        this.onWake?.(session.id);
      }
    }

    return woken;
  }
}
