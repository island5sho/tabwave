import { resolveConflict } from '../conflict-resolver';
import { Session } from '../../types/session';

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  id: 'session-1',
  deviceId: 'device-a',
  tabs: [],
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
});

describe('resolveConflict', () => {
  it('returns local session unchanged when no conflict exists', () => {
    const local = makeSession({ tabs: [{ url: 'https://example.com', title: 'Example', pinned: false }] });
    const remote = makeSession({ tabs: [{ url: 'https://example.com', title: 'Example', pinned: false }] });

    const result = resolveConflict(local, remote, 'merge-newest');

    expect(result.hadConflict).toBe(false);
    expect(result.resolved).toEqual(local);
  });

  it('local-wins strategy returns local session on conflict', () => {
    const local = makeSession({ tabs: [{ url: 'https://local.com', title: 'Local', pinned: false }] });
    const remote = makeSession({ tabs: [{ url: 'https://remote.com', title: 'Remote', pinned: false }] });

    const result = resolveConflict(local, remote, 'local-wins');

    expect(result.hadConflict).toBe(true);
    expect(result.resolved.tabs).toEqual(local.tabs);
    expect(result.strategy).toBe('local-wins');
  });

  it('remote-wins strategy returns remote session on conflict', () => {
    const local = makeSession({ tabs: [{ url: 'https://local.com', title: 'Local', pinned: false }] });
    const remote = makeSession({ tabs: [{ url: 'https://remote.com', title: 'Remote', pinned: false }] });

    const result = resolveConflict(local, remote, 'remote-wins');

    expect(result.hadConflict).toBe(true);
    expect(result.resolved.tabs).toEqual(remote.tabs);
    expect(result.strategy).toBe('remote-wins');
  });

  it('merge-newest combines tabs from both sessions, preferring newer', () => {
    const local = makeSession({
      updatedAt: 2000,
      tabs: [
        { url: 'https://shared.com', title: 'Shared Local', pinned: false },
        { url: 'https://local-only.com', title: 'Local Only', pinned: false },
      ],
    });
    const remote = makeSession({
      updatedAt: 1500,
      tabs: [
        { url: 'https://shared.com', title: 'Shared Remote', pinned: false },
        { url: 'https://remote-only.com', title: 'Remote Only', pinned: false },
      ],
    });

    const result = resolveConflict(local, remote, 'merge-newest');

    expect(result.hadConflict).toBe(true);
    const urls = result.resolved.tabs.map((t) => t.url);
    expect(urls).toContain('https://shared.com');
    expect(urls).toContain('https://local-only.com');
    expect(urls).toContain('https://remote-only.com');

    const shared = result.resolved.tabs.find((t) => t.url === 'https://shared.com');
    expect(shared?.title).toBe('Shared Local'); // local is newer
  });
});
