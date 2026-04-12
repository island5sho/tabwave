import { filterSessions, FilterOptions } from '../commands/filter';
import { TabSession } from '../../types/session';

function makeSession(overrides: Partial<TabSession> & Record<string, any> = {}): TabSession {
  return {
    id: 'session-1',
    name: 'Test Session',
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as TabSession;
}

describe('filterSessions', () => {
  it('returns all sessions when no filters applied', () => {
    const sessions = [makeSession(), makeSession({ id: 'session-2' })];
    expect(filterSessions(sessions, {})).toHaveLength(2);
  });

  it('filters by tag', () => {
    const sessions = [
      makeSession({ id: 's1', tags: ['work', 'dev'] }),
      makeSession({ id: 's2', tags: ['personal'] }),
      makeSession({ id: 's3', tags: [] }),
    ];
    const result = filterSessions(sessions, { tag: 'work' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
  });

  it('filters by pinned', () => {
    const sessions = [
      makeSession({ id: 's1', pinned: true }),
      makeSession({ id: 's2', pinned: false }),
      makeSession({ id: 's3' }),
    ];
    const result = filterSessions(sessions, { pinned: true });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
  });

  it('filters by archived', () => {
    const sessions = [
      makeSession({ id: 's1', archived: true }),
      makeSession({ id: 's2', archived: false }),
    ];
    const result = filterSessions(sessions, { archived: false });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s2');
  });

  it('filters by minTabs', () => {
    const sessions = [
      makeSession({ id: 's1', tabs: [{ url: 'a' }, { url: 'b' }, { url: 'c' }] as any }),
      makeSession({ id: 's2', tabs: [{ url: 'a' }] as any }),
    ];
    const result = filterSessions(sessions, { minTabs: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
  });

  it('filters by maxTabs', () => {
    const sessions = [
      makeSession({ id: 's1', tabs: [{ url: 'a' }, { url: 'b' }, { url: 'c' }] as any }),
      makeSession({ id: 's2', tabs: [{ url: 'a' }] as any }),
    ];
    const result = filterSessions(sessions, { maxTabs: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s2');
  });

  it('combines multiple filters', () => {
    const sessions = [
      makeSession({ id: 's1', tags: ['work'], pinned: true, tabs: [{ url: 'a' }, { url: 'b' }] as any }),
      makeSession({ id: 's2', tags: ['work'], pinned: false, tabs: [{ url: 'a' }] as any }),
      makeSession({ id: 's3', tags: ['personal'], pinned: true, tabs: [{ url: 'a' }, { url: 'b' }] as any }),
    ];
    const result = filterSessions(sessions, { tag: 'work', pinned: true, minTabs: 2 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
  });

  it('returns empty array when nothing matches', () => {
    const sessions = [makeSession({ tags: ['personal'] })];
    const result = filterSessions(sessions, { tag: 'work' });
    expect(result).toHaveLength(0);
  });
});
