import axios from 'axios';
import { printWakeDormantNotedResult, createWakeDormantNotedCommand } from '../commands/wake-dormant-noted';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantNotedResult', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints message when no sessions woken', () => {
    printWakeDormantNotedResult({ woken: [] });
    expect(consoleSpy).toHaveBeenCalledWith('No dormant noted sessions to wake.');
  });

  it('prints woken session ids', () => {
    printWakeDormantNotedResult({ woken: ['abc', 'def'] });
    expect(consoleSpy).toHaveBeenCalledWith('Woke 2 dormant noted session(s):');
    expect(consoleSpy).toHaveBeenCalledWith('  - abc');
    expect(consoleSpy).toHaveBeenCalledWith('  - def');
  });
});

describe('createWakeDormantNotedCommand', () => {
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('calls the server and prints result', async () => {
    mockedAxios.post.mockResolvedValue({ data: { woken: ['session-1'] } });
    const cmd = createWakeDormantNotedCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/sessions/wake-dormant-noted');
    expect(consoleSpy).toHaveBeenCalledWith('Woke 1 dormant noted session(s):');
  });

  it('exits on server error', async () => {
    mockedAxios.post.mockRejectedValue(new Error('connection refused'));
    const cmd = createWakeDormantNotedCommand();
    await expect(cmd.parseAsync(['node', 'test'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalledWith('Failed to wake dormant noted sessions:', 'connection refused');
  });
});
