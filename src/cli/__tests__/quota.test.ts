import axios from 'axios';
import { Command } from 'commander';
import { createQuotaCommand, printQuota, QuotaInfo } from '../commands/quota';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockQuota: QuotaInfo = {
  sessionCount: 5,
  tabCount: 42,
  maxSessions: 100,
  maxTabs: 5000,
  storageBytes: 2048,
  maxStorageBytes: 10485760,
};

describe('printQuota', () => {
  it('prints quota info', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printQuota(mockQuota);
    expect(spy).toHaveBeenCalledWith('Quota Usage:');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('5/100'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('42/5000'));
    spy.mockRestore();
  });
});

describe('createQuotaCommand', () => {
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints quota on success', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockQuota });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const cmd = createQuotaCommand('http://localhost:3000');
    await cmd.parseAsync([], { from: 'user' });
    expect(logSpy).toHaveBeenCalledWith('Quota Usage:');
  });

  it('outputs JSON when --json flag is set', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockQuota });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const cmd = createQuotaCommand('http://localhost:3000');
    await cmd.parseAsync(['--json'], { from: 'user' });
    const output = logSpy.mock.calls[0][0];
    expect(JSON.parse(output)).toMatchObject({ sessionCount: 5 });
  });

  it('exits on error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const cmd = createQuotaCommand('http://localhost:3000');
    await expect(cmd.parseAsync([], { from: 'user' })).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
