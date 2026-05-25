import { isDormantLocked, startDormantLockedSweeper } from '../dormant-locked-sweeper';
import { Session } from '../../types/session';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'abc',
    name: 'Test',
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    locked: false,
    dormant: false,
    ...overrides,
  } as Session;
}

describe('isDormantLocked', () => {
  const threshold = 7 * 24 * 60 * 60 * 1000;

  it('returns false if session is not locked', () => {
    const session = makeSession({ locked: false, updatedAt: new Date(Date.now() - threshold - 1000).toISOString() });
    expect(isDormantLocked(session, threshold)).toBe(false);
  });

  it('returns false if session is locked but recently active', () => {
    const session = makeSession({ locked: true, updatedAt: new Date(Date.now() - 1000).toISOString() });
    expect(isDormantLocked(session, threshold)).toBe(false);
  });

  it('returns true if session is locked and exceeds threshold', () => {
    const session = makeSession({ locked: true, updatedAt: new Date(Date.now() - threshold - 1000).toISOString() });
    expect(isDormantLocked(session, threshold)).toBe(true);
  });

  it('falls back to createdAt if updatedAt is missing', () => {
    const session = makeSession({ locked: true, updatedAt: undefined, createdAt: new Date(Date.now() - threshold - 1000).toISOString() });
    expect(isDormantLocked(session, threshold)).toBe(true);
  });
});

describe('startDormantLockedSweeper', () => {
  it('marks dormant locked sessions as dormant on interval', async () => {
    const staleDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const session = makeSession({ id: 's1', locked: true, updatedAt: staleDate });
    const store = {
      getAll: jest.fn().mockResolvedValue([session]),
      update: jest.fn().mockResolvedValue({ ...session, dormant: true }),
    } as any;

    const timer = startDormantLockedSweeper(store, { intervalMs: 50 });
    await new Promise((r) => setTimeout(r, 120));
    clearInterval(timer);

    expect(store.update).toHaveBeenCalledWith('s1', { dormant: true });
  });

  it('does not mark non-locked sessions as dormant', async () => {
    const staleDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const session = makeSession({ id: 's2', locked: false, updatedAt: staleDate });
    const store = {
      getAll: jest.fn().mockResolvedValue([session]),
      update: jest.fn(),
    } as any;

    const timer = startDormantLockedSweeper(store, { intervalMs: 50 });
    await new Promise((r) => setTimeout(r, 120));
    clearInterval(timer);

    expect(store.update).not.toHaveBeenCalled();
  });
});
