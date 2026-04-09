import { SessionStore } from '../storage/session-store';
import { SessionSyncer } from './session-syncer';
import { diffSessions, hasDiff } from './session-diff';
import { Session } from '../types/session';

export interface PollerOptions {
  intervalMs?: number;
  onSync?: (session: Session) => void;
  onError?: (err: Error) => void;
}

export class SessionPoller {
  private store: SessionStore;
  private syncer: SessionSyncer;
  private intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private onSync?: (session: Session) => void;
  private onError?: (err: Error) => void;

  constructor(store: SessionStore, syncer: SessionSyncer, options: PollerOptions = {}) {
    this.store = store;
    this.syncer = syncer;
    this.intervalMs = options.intervalMs ?? 5000;
    this.onSync = options.onSync;
    this.onError = options.onError;
  }

  start(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(() => this.poll(), this.intervalMs);
  }

  stop(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  isRunning(): boolean {
    return this.timer !== null;
  }

  private async poll(): Promise<void> {
    try {
      const sessions = this.store.getAll();
      for (const local of sessions) {
        const remote = await this.syncer.fetchRemote(local.id);
        if (!remote) continue;
        const diff = diffSessions(local, remote);
        if (hasDiff(diff)) {
          const synced = await this.syncer.sync(local.id);
          if (synced) {
            this.store.save(synced);
            this.onSync?.(synced);
          }
        }
      }
    } catch (err) {
      this.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
