import axios from 'axios';
import { Command } from 'commander';
import { createExpireCommand, formatExpiry } from '../commands/expire';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const HOST = 'http://localhost:3000';

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createExpireCommand());
  program.exitOverride();
  await program.parseAsync(['node', 'test', 'expire', ...args]);
}

describe('formatExpiry', () => {
  it('returns expired for past dates', () => {
    expect(formatExpiry(new Date(Date.now() - 1000).toISOString())).toBe('expired');
  });

  it('formats hours and minutes', () => {
    const future = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    expect(formatExpiry(future)).toMatch(/expires in 1h \d+m/);
  });

  it('formats minutes only when under an hour', () => {
    const future = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    expect(formatExpiry(future)).toMatch(/expires in 30m/);
  });
});

describe('expire command', () => {
  const mockSession = { id: 'abc', name: 'Work', expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() };

  beforeEach(() => jest.clearAllMocks());

  it('sets expiry with default ttl', async () => {
    mockedAxios.patch.mockResolvedValue({ data: mockSession });
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await runCommand(['abc']);
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      `${HOST}/sessions/abc/expire`,
      expect.objectContaining({ expiresAt: expect.any(String) })
    );
    spy.mockRestore();
  });

  it('sets expiry with custom ttl', async () => {
    mockedAxios.patch.mockResolvedValue({ data: mockSession });
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await runCommand(['abc', '--ttl', '120']);
    const call = mockedAxios.patch.mock.calls[0][1] as { expiresAt: string };
    const diff = new Date(call.expiresAt).getTime() - Date.now();
    expect(diff).toBeGreaterThan(119 * 60 * 1000);
    spy.mockRestore();
  });

  it('clears expiry with --clear flag', async () => {
    mockedAxios.patch.mockResolvedValue({ data: { ...mockSession, expiresAt: undefined } });
    const spy = jest.spyOn(console, 'log').mockImplementation();
    await runCommand(['abc', '--clear']);
    expect(mockedAxios.patch).toHaveBeenCalledWith(`${HOST}/sessions/abc/expire`, { expiresAt: null });
    spy.mockRestore();
  });

  it('exits with error on server failure', async () => {
    mockedAxios.patch.mockRejectedValue({ response: { data: { error: 'Not found' } } });
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runCommand(['bad-id'])).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith('Error: Not found');
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
