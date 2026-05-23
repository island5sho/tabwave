import axios from 'axios';
import { printWakeDormantResult, createWakeDormantCommand, WakeDormantResult } from '../commands/wake-dormant';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

async function runCommand(args: string[]): Promise<void> {
  const cmd = createWakeDormantCommand();
  await cmd.parseAsync(['node', 'wake-dormant', ...args]);
}

describe('printWakeDormantResult', () => {
  beforeEach(() => jest.clearAllMocks());

  it('prints message when no dormant sessions', () => {
    printWakeDormantResult({ woken: [], skipped: [] });
    expect(mockLog).toHaveBeenCalledWith('No dormant sessions to wake.');
  });

  it('prints woken sessions', () => {
    printWakeDormantResult({ woken: ['alpha', 'beta'], skipped: [] });
    expect(mockLog).toHaveBeenCalledWith('Woke 2 dormant session(s):');
    expect(mockLog).toHaveBeenCalledWith('  ✓ alpha');
    expect(mockLog).toHaveBeenCalledWith('  ✓ beta');
  });

  it('prints skipped sessions', () => {
    printWakeDormantResult({ woken: ['alpha'], skipped: ['gamma'] });
    expect(mockLog).toHaveBeenCalledWith('Skipped 1 session(s) (not dormant):');
    expect(mockLog).toHaveBeenCalledWith('  - gamma');
  });
});

describe('createWakeDormantCommand', () => {
  beforeEach(() => jest.clearAllMocks());

  it('wakes all dormant sessions', async () => {
    const result: WakeDormantResult = { woken: ['work', 'research'], skipped: [] };
    mockedAxios.post.mockResolvedValue({ data: result });
    await runCommand([]);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/wake-dormant'),
      {}
    );
    expect(mockLog).toHaveBeenCalledWith('Woke 2 dormant session(s):');
  });

  it('passes tag filter to server', async () => {
    const result: WakeDormantResult = { woken: ['tagged-session'], skipped: [] };
    mockedAxios.post.mockResolvedValue({ data: result });
    await runCommand(['--tag', 'work']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      { tag: 'work' }
    );
  });

  it('shows dry-run preview without applying changes', async () => {
    const result: WakeDormantResult = { woken: ['alpha'], skipped: [] };
    mockedAxios.post.mockResolvedValue({ data: result });
    await runCommand(['--dry-run']);
    expect(mockLog).toHaveBeenCalledWith('[dry-run] Would wake 1 dormant session(s):');
    expect(mockLog).toHaveBeenCalledWith('  ~ alpha');
  });

  it('exits with error on failure', async () => {
    mockedAxios.post.mockRejectedValue(new Error('connection refused'));
    await expect(runCommand([])).rejects.toThrow('process.exit');
    expect(mockError).toHaveBeenCalledWith(
      'Failed to wake dormant sessions:',
      'connection refused'
    );
  });
});
