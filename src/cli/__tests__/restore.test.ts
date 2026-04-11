import { createRestoreCommand } from '../commands/restore';
import fetch from 'node-fetch';

jest.mock('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const mockSession = {
  id: 'abc123',
  name: 'Work',
  tabs: [
    { id: 't1', url: 'https://example.com', title: 'Example', pinned: false },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  tags: [],
  archived: false,
  snapshots: [],
};

const mockExit = jest
  .spyOn(process, 'exit')
  .mockImplementation((_code?: number) => undefined as never);

const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {});

async function runCommand(...args: string[]) {
  const cmd = createRestoreCommand();
  await cmd.parseAsync(['node', 'restore', ...args]);
}

describe('restore command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('restores a session from a snapshot and prints confirmation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSession,
    } as any);

    await runCommand('abc123', '0');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/abc123/restore',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ snapshotIndex: 0 }),
      })
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('Restored session "Work"')
    );
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('1 tab(s)')
    );
  });

  it('exits with error when session or snapshot not found (404)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'snapshot not found' }),
    } as any);

    await runCommand('abc123', '5');

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('snapshot not found')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('exits with error on non-negative integer validation failure', async () => {
    await runCommand('abc123', '-1');

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('non-negative integer')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('exits with error when server is unreachable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await runCommand('abc123', '0');

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('could not connect')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
