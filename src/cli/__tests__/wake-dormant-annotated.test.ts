import axios from 'axios';
import { Command } from 'commander';
import {
  printWakeDormantAnnotatedResult,
  createWakeDormantAnnotatedCommand
} from '../commands/wake-dormant-annotated';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantAnnotatedResult', () => {
  let spy: jest.SpyInstance;
  beforeEach(() => { spy = jest.spyOn(console, 'log').mockImplementation(); });
  afterEach(() => spy.mockRestore());

  it('prints message when no sessions woken', () => {
    printWakeDormantAnnotatedResult([]);
    expect(spy).toHaveBeenCalledWith('No dormant annotated sessions to wake.');
  });

  it('prints count and ids when sessions woken', () => {
    printWakeDormantAnnotatedResult(['abc', 'def']);
    expect(spy).toHaveBeenCalledWith('Woke 2 dormant annotated session(s):');
    expect(spy).toHaveBeenCalledWith('  - abc');
    expect(spy).toHaveBeenCalledWith('  - def');
  });
});

describe('createWakeDormantAnnotatedCommand', () => {
  let exitSpy: jest.SpyInstance;
  let errSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    errSpy = jest.spyOn(console, 'error').mockImplementation();
  });
  afterEach(() => {
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('calls the correct endpoint and prints result', async () => {
    mockedAxios.post.mockResolvedValue({ data: { woken: ['id1'] } });
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const cmd = createWakeDormantAnnotatedCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-annotated'
    );
    expect(logSpy).toHaveBeenCalledWith('Woke 1 dormant annotated session(s):');
    logSpy.mockRestore();
  });

  it('handles server error gracefully', async () => {
    mockedAxios.post.mockRejectedValue({ message: 'Network Error', response: undefined });
    await expect(
      createWakeDormantAnnotatedCommand().parseAsync(['node', 'test'])
    ).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith('Error:', 'Network Error');
  });
});
