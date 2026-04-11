import { createWatchCommand } from '../commands/watch';
import axios from 'axios';
import chalk from 'chalk';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSessions = [
  { id: '1', name: 'work', tabCount: 4, pinned: false, archived: false, tags: ['dev'] },
  { id: '2', name: 'personal', tabCount: 2, pinned: true, archived: false, tags: [] },
];

describe('watch command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'clear').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should print sessions on first poll', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: mockSessions });

    const cmd = createWatchCommand();
    const parsePromise = cmd.parseAsync(['node', 'tabwave', '--interval', '9999']);

    await Promise.resolve();
    await Promise.resolve();

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Sessions'));
    process.emit('SIGINT');
    await parsePromise.catch(() => {});
  });

  it('should show error message when server is unreachable', async () => {
    mockedAxios.get = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const cmd = createWatchCommand();
    const parsePromise = cmd.parseAsync(['node', 'tabwave', '--interval', '9999999']);

    await Promise.resolve();
    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Could not reach server'));
    process.emit('SIGINT');
    await parsePromise.catch(() => {});
  });

  it('should display pinned and tag indicators', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: mockSessions });

    const cmd = createWatchCommand();
    const parsePromise = cmd.parseAsync(['node', 'tabwave', '--interval', '9999999']);

    await Promise.resolve();
    await Promise.resolve();

    const allOutput = consoleLogSpy.mock.calls.flat().join(' ');
    expect(allOutput).toMatch(/pinned|dev/);
    process.emit('SIGINT');
    await parsePromise.catch(() => {});
  });
});
