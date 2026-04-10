import { createHistoryCommand } from '../commands/history';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockEntries = [
  {
    sessionId: 'abc12345-0000-0000-0000-000000000000',
    name: 'Work Session',
    timestamp: '2024-01-15T10:30:00.000Z',
    tabCount: 5,
    action: 'push',
  },
  {
    sessionId: 'def67890-0000-0000-0000-000000000000',
    name: 'Research',
    timestamp: '2024-01-15T09:00:00.000Z',
    tabCount: 12,
    action: 'merge',
  },
];

async function runCommand(args: string[]): Promise<void> {
  const cmd = createHistoryCommand();
  await cmd.parseAsync(['node', 'tabwave', ...args]);
}

describe('history command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches and displays history entries', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockEntries });

    await runCommand([]);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/history',
      expect.objectContaining({ params: expect.objectContaining({ limit: 20 }) })
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Work Session')
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Research')
    );
  });

  it('respects --limit option', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [mockEntries[0]] });

    await runCommand(['--limit', '5']);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ params: expect.objectContaining({ limit: 5 }) })
    );
  });

  it('filters by session ID when --session is provided', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [mockEntries[0]] });

    await runCommand(['--session', 'abc12345']);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({ sessionId: 'abc12345' }),
      })
    );
  });

  it('prints message when no history entries found', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    await runCommand([]);

    expect(console.log).toHaveBeenCalledWith('No history entries found.');
  });

  it('handles server error gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Connection refused'));

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(runCommand([])).rejects.toThrow('exit');
    expect(console.error).toHaveBeenCalledWith(
      'Failed to fetch history:',
      'Connection refused'
    );
    exitSpy.mockRestore();
  });
});
