import { isDormantBookmarked, startDormantBookmarkedSweeper } from '../dormant-bookmarked-sweeper';
import { Session } from '../../types/session';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test-id',
    name: 'Test',
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    bookmarked: false,
    dormant: false,
    ...overrides,
  } as Session;
}

describe('isDormantBookmarked', () => {
  const threshold = 7 * 24 * 60 * 60 * 1000;

  it('returns false when not bookmarked', () => {
    const s = makeSession({ bookmarked: false });
    expect(isDormantBookmarked(s, threshold)).toBe(false);
  });

  it('returns false when already dormant', () => {
    const s = makeSession({ bookmarked: true, dormant: true });
    expect(isDormantBookmarked(s, threshold)).toBe(false);
  });

  it('returns false when recently updated', () => {
    const s = makeSession({
      bookmarked: true,
      updatedAt: new Date().toISOString(),
    });
    expect(isDormantBookmarked(s, threshold)).toBe(false);
  });

  it('returns true when bookmarked and stale', () => {
    const s = makeSession({ bookmarked: true });
    expect(isDormantBookmarked(s, threshold)).toBe(true);
  });
});

describe('startDormantBookmarkedSweeper', () => {
  it('marks stale bookmarked sessions as dormant', async () => {
    const staleSession = makeSession({ id: 'stale', bookmarked: true });
    const freshSession = makeSession({
      id: 'fresh',
      bookmarked: true,
      updatedAt: new Date().toISOString(),
    });
    const store = {
      getAll: jest.fn().mockResolvedValue([staleSession, freshSession]),
      update: jest.fn().mockResolvedValue(undefined),
    } as any;

    const timer = startDormantBookmarkedSweeper(store, 50, 7 * 24 * 60 * 60 * 1000);
    await new Promise((r) => setTimeout(r, 100));
    clearInterval(timer);

    expect(store.update).toHaveBeenCalledWith('stale', { dormant: true });
    expect(store.update).not.toHaveBeenCalledWith('fresh', expect.anything());
  });
});
