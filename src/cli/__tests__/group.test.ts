import { groupSessions } from '../commands/group';
import { TabSession } from '../../types/session';

function makeSession(overrides: Partial<TabSession> = {}): TabSession {
  return {
    id: 'sess-1',
    name: 'Test Session',
    tabs: [],
    tags: [],
    device: 'laptop',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-06-01T10:00:00.000Z',
    pinned: false,
    locked: false,
    archived: false,
    ...overrides,
  };
}

describe('groupSessions', () => {
  it('groups by tag', () => {
    const sessions = [
      makeSession({ id: 'a', tags: ['work'] }),
      makeSession({ id: 'b', tags: ['personal'] }),
      makeSession({ id: 'c', tags: ['work', 'personal'] }),
    ];
    const result = groupSessions(sessions, 'tag');
    expect(result['work']).toHaveLength(2);
    expect(result['personal']).toHaveLength(2);
  });

  it('groups untagged sessions under (untagged)', () => {
    const sessions = [makeSession({ id: 'a', tags: [] })];
    const result = groupSessions(sessions, 'tag');
    expect(result['(untagged)']).toHaveLength(1);
  });

  it('groups by device', () => {
    const sessions = [
      makeSession({ id: 'a', device: 'laptop' }),
      makeSession({ id: 'b', device: 'desktop' }),
      makeSession({ id: 'c', device: 'laptop' }),
    ];
    const result = groupSessions(sessions, 'device');
    expect(result['laptop']).toHaveLength(2);
    expect(result['desktop']).toHaveLength(1);
  });

  it('groups by date', () => {
    const sessions = [
      makeSession({ id: 'a', updatedAt: '2024-06-01T08:00:00.000Z' }),
      makeSession({ id: 'b', updatedAt: '2024-06-01T20:00:00.000Z' }),
      makeSession({ id: 'c', updatedAt: '2024-07-15T12:00:00.000Z' }),
    ];
    const result = groupSessions(sessions, 'date');
    expect(result['2024-06-01']).toHaveLength(2);
    expect(result['2024-07-15']).toHaveLength(1);
  });

  it('returns empty object for empty session list', () => {
    const result = groupSessions([], 'tag');
    expect(result).toEqual({});
  });

  it('uses (unknown) for missing device', () => {
    const sessions = [makeSession({ id: 'a', device: undefined })];
    const result = groupSessions(sessions, 'device');
    expect(result['(unknown)']).toHaveLength(1);
  });
});
