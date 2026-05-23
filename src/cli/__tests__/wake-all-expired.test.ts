import axios from 'axios';
import { Command } from 'commander';
import {
  printWakeAllExpiredResult,
  createWakeAllExpiredCommand,
  WakeAllExpiredResult,
} from '../commands/wake-all-expired';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

afterEach(() => jest.clearAllMocks());

async function runCommand(args: string[] = []): Promise<void> {
  const program = new Command();
  program.addCommand(createWakeAllExpiredCommand());
  await program.parseAsync(['node', 'test', 'wake-all-expired', ...args]);
}

describe('printWakeAllExpiredResult', () => {
  it('prints message when nothing woken', () => {
    printWakeAllExpiredResult({ woken: [], skipped: [], total: 0 });
    expect(logSpy).toHaveBeenCalledWith('No expired sessions to wake.');
  });

  it('prints woken sessions', () => {
    const result: WakeAllExpiredResult = { woken: ['abc', 'def'], skipped: [], total: 2 };
    printWakeAllExpiredResult(result);
    expect(logSpy).toHaveBeenCalledWith('Woke 2 expired session(s):');
    expect(logSpy).toHaveBeenCalledWith('  ✓ abc');
    expect(logSpy).toHaveBeenCalledWith('  ✓ def');
  });

  it('prints skipped sessions', () => {
    const result: WakeAllExpiredResult = { woken: ['abc'], skipped: ['xyz'], total: 2 };
    printWakeAllExpiredResult(result);
    expect(logSpy).toHaveBeenCalledWith('Skipped 1 session(s) (protected or frozen):');
    expect(logSpy).toHaveBeenCalledWith('  - xyz');
  });
});

describe('createWakeAllExpiredCommand', () => {
  it('posts and prints result on success', async () => {
    const result: WakeAllExpiredResult = { woken: ['s1'], skipped: [], total: 1 };
    mockedAxios.post.mockResolvedValueOnce({ data: result });
    await runCommand();
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-all-expired'
    );
    expect(logSpy).toHaveBeenCalledWith('Woke 1 expired session(s):');
  });

  it('respects custom host and port', async () => {
    const result: WakeAllExpiredResult = { woken: [], skipped: [], total: 0 };
    mockedAxios.post.mockResolvedValueOnce({ data: result });
    await runCommand(['--host', '0.0.0.0', '--port', '4000']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://0.0.0.0:4000/sessions/wake-all-expired'
    );
  });

  it('prints error and exits on failure', async () => {
    mockedAxios.post.mockRejectedValueOnce({ message: 'connection refused' });
    await runCommand();
    expect(errorSpy).toHaveBeenCalledWith('Error: connection refused');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('uses server error message when available', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'internal server error' } },
    });
    await runCommand();
    expect(errorSpy).toHaveBeenCalledWith('Error: internal server error');
  });
});
