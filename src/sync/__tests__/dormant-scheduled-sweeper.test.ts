import { isDormantScheduled, startDormantScheduledSweeper } from '../dormant-scheduled-sweeper';
import { Session } from '../../types/session';

const THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test-id',
    name: 'Test Session',
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as Session;
}

describe('isDormantScheduled', () => {
  it('returns false if no scheduledAt', () => {
    const s = makeSession();
    expect(isDormantScheduled(s)).toBe(false);
  });

  it('returns false if already dormant', () => {
    const old = new Date(Date.now() - THRESHOLD_MS - 1000).toISOString();
    const s = makeSession({ scheduledAt: old, dormant: true });
    expect(isDormantScheduled(s)).toBe(false);
  });

  it('returns false if scheduled time is recent', () => {
    const recent = new Date(Date.now() - 1000).toISOString();
    const s = makeSession({ scheduledAt: recent });
    expect(isDormantScheduled(s)).toBe(false);
  });

  it('returns true if scheduled time exceeds threshold', () => {
    const old = new Date(Date.now() - THRESHOLD_MS - 1000).toISOString();
    const s = makeSession({ scheduledAt: old });
    expect(isDormantScheduled(s)).toBe(true);
  });
});

describe('startDormantScheduledSweeper', () => {
  it('marks sessions dormant when scheduled time is stale', async () => {
    const old = new Date(Date.now() - THRESHOLD_MS - 1000).toISOString();
    const session = makeSession({ id: 'stale-1', scheduledAt: old });
    const store: any = {
      getAll: jest.fn().mockResolvedValue([session]),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const timer = startDormantScheduledSweeper(store, 50);
    await new Promise((r) => setTimeout(r, 100));
    clearInterval(timer);
    expect(store.update).toHaveBeenCalledWith('stale-1', { dormant: true });
  });

  it('does not mark recent scheduled sessions dormant', async () => {
    const recent = new Date(Date.now() - 1000).toISOString();
    const session = makeSession({ id: 'fresh-1', scheduledAt: recent });
    const store: any = {
      getAll: jest.fn().mockResolvedValue([session]),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const timer = startDormantScheduledSweeper(store, 50);
    await new Promise((r) => setTimeout(r, 100));
    clearInterval(timer);
    expect(store.update).not.toHaveBeenCalled();
  });
});
