import axios from 'axios';
import {
  printWakeDormantPinnedAllResult,
  createWakeDormantPinnedAllCommand,
} from '../commands/wake-dormant-pinned-all';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantPinnedAllResult', () => {
  it('prints message when no sessions woken', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    printWakeDormantPinnedAllResult({ woken: [], count: 0 });
    expect(spy).toHaveBeenCalledWith('No dormant pinned sessions found.');
    spy.mockRestore();
  });

  it('prints woken session ids', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    printWakeDormantPinnedAllResult({ woken: ['abc', 'def'], count: 2 });
    expect(spy).toHaveBeenCalledWith('Woke 2 dormant pinned session(s):');
    expect(spy).toHaveBeenCalledWith('  - abc');
    expect(spy).toHaveBeenCalledWith('  - def');
    spy.mockRestore();
  });
});

describe('createWakeDormantPinnedAllCommand', () => {
  it('calls the correct endpoint and prints result', async () => {
    mockedAxios.post = jest.fn().mockResolvedValue({
      data: { woken: ['s1'], count: 1 },
    });
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const cmd = createWakeDormantPinnedAllCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-pinned'
    );
    expect(spy).toHaveBeenCalledWith('Woke 1 dormant pinned session(s):');
    spy.mockRestore();
  });

  it('exits on error', async () => {
    mockedAxios.post = jest.fn().mockRejectedValue({
      message: 'Network error',
      response: { data: { error: 'server error' } },
    });
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const cmd = createWakeDormantPinnedAllCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(exitSpy).toHaveBeenCalledWith(1);
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
