import axios from 'axios';
import { Command } from 'commander';
import {
  printWakeDormantRemindedResult,
  createWakeDormantRemindedCommand
} from '../commands/wake-dormant-reminded';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantRemindedResult', () => {
  let spy: jest.SpyInstance;
  beforeEach(() => { spy = jest.spyOn(console, 'log').mockImplementation(); });
  afterEach(() => { spy.mockRestore(); });

  it('prints message when no sessions woken', () => {
    printWakeDormantRemindedResult([]);
    expect(spy).toHaveBeenCalledWith('No dormant reminded sessions to wake.');
  });

  it('prints woken session ids', () => {
    printWakeDormantRemindedResult(['abc', 'def']);
    expect(spy).toHaveBeenCalledWith('Woke 2 dormant reminded session(s):');
    expect(spy).toHaveBeenCalledWith('  - abc');
    expect(spy).toHaveBeenCalledWith('  - def');
  });
});

describe('createWakeDormantRemindedCommand', () => {
  let logSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  });

  afterEach(() => {
    logSpy.mockRestore();
    exitSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('calls server and prints result', async () => {
    mockedAxios.post.mockResolvedValue({ data: { woken: ['s1'] } });
    const cmd = createWakeDormantRemindedCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-reminded'
    );
    expect(logSpy).toHaveBeenCalledWith('Woke 1 dormant reminded session(s):');
  });

  it('exits on error', async () => {
    mockedAxios.post.mockRejectedValue(new Error('conn refused'));
    const cmd = createWakeDormantRemindedCommand();
    await expect(cmd.parseAsync(['node', 'test'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
