import axios from 'axios';
import { createWakeDormantScheduledCommand, printWakeDormantScheduledResult } from '../commands/wake-dormant-scheduled';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantScheduledResult', () => {
  it('prints message when no sessions woken', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printWakeDormantScheduledResult([]);
    expect(spy).toHaveBeenCalledWith('No dormant scheduled sessions to wake.');
    spy.mockRestore();
  });

  it('prints woken session ids', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printWakeDormantScheduledResult(['abc', 'def']);
    expect(spy).toHaveBeenCalledWith('Woke 2 dormant scheduled session(s):');
    expect(spy).toHaveBeenCalledWith('  - abc');
    expect(spy).toHaveBeenCalledWith('  - def');
    spy.mockRestore();
  });
});

describe('createWakeDormantScheduledCommand', () => {
  it('calls the correct endpoint and prints results', async () => {
    mockedAxios.post = jest.fn().mockResolvedValue({ data: { woken: ['s1', 's2'] } });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const cmd = createWakeDormantScheduledCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/sessions/wake-dormant-scheduled');
    expect(spy).toHaveBeenCalledWith('Woke 2 dormant scheduled session(s):');
    spy.mockRestore();
  });

  it('exits with code 1 on error', async () => {
    mockedAxios.post = jest.fn().mockRejectedValue(new Error('connection refused'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const cmd = createWakeDormantScheduledCommand();
    await expect(cmd.parseAsync(['node', 'test'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
