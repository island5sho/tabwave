import axios from 'axios';
import { exec } from 'child_process';
import { openSessionTabs, createOpenCommand } from '../commands/open';
import { TabSession } from '../../types/session';

jest.mock('axios');
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));
jest.mock('util', () => ({
  promisify: (fn: Function) => fn,
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedExec = exec as jest.MockedFunction<typeof exec>;

const mockSession: TabSession = {
  name: 'work',
  tabs: [
    { url: 'https://github.com', title: 'GitHub' },
    { url: 'https://example.com', title: 'Example' },
  ],
  updatedAt: new Date().toISOString(),
};

describe('openSessionTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(process, 'platform', { value: 'darwin', writable: true });
  });

  it('opens all tabs in the session', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockSession });
    (mockedExec as any).mockImplementation((_cmd: string, cb: Function) =>
      cb(null, '', '')
    );

    await openSessionTabs('work', 'http://localhost:3000');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/work'
    );
    expect(mockedExec).toHaveBeenCalledTimes(2);
    expect(mockedExec).toHaveBeenCalledWith(
      'open "https://github.com"',
      expect.any(Function)
    );
  });

  it('logs a message when session has no tabs', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockedAxios.get.mockResolvedValue({ data: { ...mockSession, tabs: [] } });

    await openSessionTabs('empty', 'http://localhost:3000');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No tabs found')
    );
    expect(mockedExec).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('createOpenCommand --dry-run', () => {
  it('lists tabs without opening them', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockedAxios.get.mockResolvedValue({ data: mockSession });

    const cmd = createOpenCommand('http://localhost:3000');
    await cmd.parseAsync(['node', 'test', 'work', '--dry-run']);

    expect(mockedExec).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Tabs in session')
    );
    consoleSpy.mockRestore();
  });

  it('exits with error when session not found', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    mockedAxios.get.mockRejectedValue({ response: { status: 404 } });

    const cmd = createOpenCommand('http://localhost:3000');
    await expect(
      cmd.parseAsync(['node', 'test', 'missing'])
    ).rejects.toThrow();

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
