import { diffSessions, hasDiff, applyDiff } from '../session-diff';
import { Session } from '../../types/session';

const makeSession = (tabs: Partial<{ id: string; url: string; title: string; pinned: boolean }>[]): Session => ({
  id: 'session-1',
  name: 'Test Session',
  deviceId: 'device-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tabs: tabs.map((t, i) => ({
    id: t.id ?? `tab-${i}`,
    url: t.url ?? 'https://example.com',
    title: t.title ?? 'Example',
    pinned: t.pinned ?? false,
    index: i,
  })),
});

describe('diffSessions', () => {
  it('detects added tabs', () => {
    const local = makeSession([{ id: 'a' }]);
    const remote = makeSession([{ id: 'a' }, { id: 'b' }]);
    const diff = diffSessions(local, remote);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0].id).toBe('b');
    expect(diff.removed).toHaveLength(0);
  });

  it('detects removed tabs', () => {
    const local = makeSession([{ id: 'a' }, { id: 'b' }]);
    const remote = makeSession([{ id: 'a' }]);
    const diff = diffSessions(local, remote);
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0].id).toBe('b');
  });

  it('detects updated tabs', () => {
    const local = makeSession([{ id: 'a', url: 'https://old.com' }]);
    const remote = makeSession([{ id: 'a', url: 'https://new.com' }]);
    const diff = diffSessions(local, remote);
    expect(diff.updated).toHaveLength(1);
    expect(diff.updated[0].url).toBe('https://new.com');
  });

  it('marks unchanged tabs correctly', () => {
    const local = makeSession([{ id: 'a', url: 'https://same.com', title: 'Same' }]);
    const remote = makeSession([{ id: 'a', url: 'https://same.com', title: 'Same' }]);
    const diff = diffSessions(local, remote);
    expect(diff.unchanged).toHaveLength(1);
    expect(hasDiff(diff)).toBe(false);
  });
});

describe('applyDiff', () => {
  it('applies added and removed tabs to base session', () => {
    const base = makeSession([{ id: 'a' }, { id: 'b' }]);
    const remote = makeSession([{ id: 'a' }, { id: 'c' }]);
    const diff = diffSessions(base, remote);
    const result = applyDiff(base, diff);
    const ids = result.tabs.map((t) => t.id);
    expect(ids).toContain('a');
    expect(ids).toContain('c');
    expect(ids).not.toContain('b');
  });
});
