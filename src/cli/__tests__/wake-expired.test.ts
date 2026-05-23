import axios from 'axios';
import { printWakeExpiredResult, createWakeExpiredCommand } from '../commands/wake-expired';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: any) => {
  throw new Error(`process.exit: ${code}`);
});

const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

afterEach(() => {
  jest.clearAllMocks();
});

describe('printWakeExpiredResult', () => {
  it('prints a message when no sessions were woken', () => {
    printWakeExpiredResult({ woken: [], skipped: [] });
    expect(consoleSpy).toHaveBeenCalledWith('No expired sessions to wake.');
  });

  it('prints woken session ids', () => {
    printWakeExpiredResult({ woken: ['abc', 'def'], skipped: [] });
    expect(consoleSpy).toHaveBeenCalledWith('Woke 2 expired session(s):');
    expect(consoleSpy).toHaveBeenCalledWith('  ✓ abc');
    expect(consoleSpy).toHaveBeenCalledWith('  ✓ def');
  });

  it('prints skipped sessions when present', () => {
    printWakeExpiredResult({ woken: ['abc'], skipped: ['xyz'] });
    expect(consoleSpy).toHaveBeenCalledWith('Skipped 1 session(s) (protected or frozen):');
    expect(consoleSpy).toHaveBeenCalledWith('  - xyz');
  });
});

describe('createWakeExpiredCommand', () => {
  async function runCommand(args: string[] = []) {
    const cmd = createWakeExpiredCommand();
    await cmd.parseAsync(['node', 'wake-expired', ...args]);
  }

  it('calls POST /sessions/wake-expired and prints result', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { woken: ['s1', 's2'], skipped: [] },
    });
    await runCommand();
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/wake-expired'),
      { dryRun: false }
    );
    expect(consoleSpy).toHaveBeenCalledWith('Woke 2 expired session(s):');
  });

  it('prints dry-run preview without modifying', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { woken: ['s3'], skipped: ['s4'] },
    });
    await runCommand(['--dry-run']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      { dryRun: true }
    );
    expect(consoleSpy).toHaveBeenCalledWith('[dry-run] Would wake 1 session(s).');
    expect(consoleSpy).toHaveBeenCalledWith('[dry-run] Would skip 1 session(s).');
  });

  it('exits with code 1 on server error', async () => {
    mockedAxios.post.mockRejectedValue({
      message: 'Network Error',
      response: { data: { error: 'server unavailable' } },
    });
    await expect(runCommand()).rejects.toThrow('process.exit: 1');
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to wake expired sessions:',
      'server unavailable'
    );
  });
});
