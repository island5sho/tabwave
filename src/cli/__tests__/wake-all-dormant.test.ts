import axios from 'axios';
import { printWakeAllDormantResult, createWakeAllDormantCommand } from '../commands/wake-all-dormant';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeSession(id: string, name: string, dormant: boolean, protected_ = false) {
  return { id, name, tabs: [], updatedAt: new Date().toISOString(), dormant, protected: protected_ };
}

describe('printWakeAllDormantResult', () => {
  let consoleSpy: jest.SpyInstance;
  beforeEach(() => { consoleSpy = jest.spyOn(console, 'log').mockImplementation(); });
  afterEach(() => { consoleSpy.mockRestore(); });

  it('prints a message when no sessions were woken', () => {
    printWakeAllDormantResult({ woken: [], skipped: [], total: 0 });
    expect(consoleSpy).toHaveBeenCalledWith('No dormant sessions found to wake.');
  });

  it('prints woken session names', () => {
    printWakeAllDormantResult({ woken: ['alpha', 'beta'], skipped: [], total: 2 });
    expect(consoleSpy).toHaveBeenCalledWith('Woke 2 dormant session(s):');
    expect(consoleSpy).toHaveBeenCalledWith('  ✓ alpha');
    expect(consoleSpy).toHaveBeenCalledWith('  ✓ beta');
  });

  it('prints skipped count when present', () => {
    printWakeAllDormantResult({ woken: ['alpha'], skipped: ['beta'], total: 2 });
    expect(consoleSpy).toHaveBeenCalledWith('Skipped 1 session(s) (not dormant or protected).');
  });
});

describe('createWakeAllDormantCommand', () => {
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('wakes dormant sessions and skips non-dormant', async () => {
    const sessions = [
      makeSession('1', 'alpha', true),
      makeSession('2', 'beta', false),
    ];
    mockedAxios.get.mockResolvedValue({ data: sessions });
    mockedAxios.post.mockResolvedValue({ data: {} });

    const cmd = createWakeAllDormantCommand();
    await cmd.parseAsync(['node', 'test', '--host', 'http://localhost:3000']);

    expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/sessions/1/wake');
    expect(mockedAxios.post).not.toHaveBeenCalledWith('http://localhost:3000/sessions/2/wake');
    expect(consoleSpy).toHaveBeenCalledWith('Woke 1 dormant session(s):');
  });

  it('skips protected dormant sessions', async () => {
    const sessions = [makeSession('1', 'locked', true, true)];
    mockedAxios.get.mockResolvedValue({ data: sessions });

    const cmd = createWakeAllDormantCommand();
    await cmd.parseAsync(['node', 'test']);

    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('No dormant sessions found to wake.');
  });

  it('handles dry-run without making requests', async () => {
    const sessions = [makeSession('1', 'alpha', true)];
    mockedAxios.get.mockResolvedValue({ data: sessions });

    const cmd = createWakeAllDormantCommand();
    await cmd.parseAsync(['node', 'test', '--dry-run']);

    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Would wake 1 dormant session(s):');
  });

  it('exits on server error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('connection refused'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation();

    const cmd = createWakeAllDormantCommand();
    await expect(cmd.parseAsync(['node', 'test'])).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith('Failed to wake dormant sessions:', 'connection refused');
    errSpy.mockRestore();
  });
});
