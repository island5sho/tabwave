import axios from 'axios';
import { printWakeDormantLockedResult, createWakeDormantLockedCommand } from '../commands/wake-dormant-locked';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSession = (id: string, name: string) => ({ id, name });

describe('printWakeDormantLockedResult', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => consoleSpy.mockRestore());

  it('prints message when no sessions woken', () => {
    printWakeDormantLockedResult([]);
    expect(consoleSpy).toHaveBeenCalledWith('No dormant locked sessions to wake.');
  });

  it('prints count and session names when sessions are woken', () => {
    const sessions = [mockSession('1', 'Alpha'), mockSession('2', 'Beta')] as any;
    printWakeDormantLockedResult(sessions);
    expect(consoleSpy).toHaveBeenCalledWith('Woke 2 dormant locked session(s):');
    expect(consoleSpy).toHaveBeenCalledWith('  - Alpha (1)');
    expect(consoleSpy).toHaveBeenCalledWith('  - Beta (2)');
  });
});

describe('createWakeDormantLockedCommand', () => {
  let exitSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('calls the server and prints results', async () => {
    const woken = [mockSession('1', 'Alpha')];
    mockedAxios.post.mockResolvedValueOnce({ data: { woken } });
    const cmd = createWakeDormantLockedCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/sessions/wake-dormant-locked');
  });

  it('exits on error', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('connection refused'));
    const cmd = createWakeDormantLockedCommand();
    await expect(cmd.parseAsync(['node', 'test'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith('Failed to wake dormant locked sessions:', 'connection refused');
  });
});
