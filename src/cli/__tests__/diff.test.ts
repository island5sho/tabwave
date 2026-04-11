import axios from 'axios';
import { Command } from 'commander';
import { createDiffCommand } from '../commands/diff';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockLocal = {
  id: 'abc123',
  name: 'Work',
  updatedAt: '2024-01-01T10:00:00Z',
  tabs: [
    { id: 't1', url: 'https://example.com', title: 'Example' },
    { id: 't2', url: 'https://removed.com', title: 'Removed' },
  ],
};

const mockRemote = {
  id: 'abc123',
  name: 'Work',
  updatedAt: '2024-01-02T10:00:00Z',
  tabs: [
    { id: 't1', url: 'https://example.com', title: 'Example' },
    { id: 't3', url: 'https://added.com', title: 'Added' },
  ],
};

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createDiffCommand());
  await program.parseAsync(['node', 'tabwave', ...args]);
}

describe('diff command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows diff between local and remote sessions', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockLocal })
      .mockResolvedValueOnce({ data: mockRemote });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(['diff', 'abc123']);

    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('Work');
    spy.mockRestore();
  });

  it('prints identical message when no diff', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockLocal })
      .mockResolvedValueOnce({ data: mockLocal });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(['diff', 'abc123']);

    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('identical');
    spy.mockRestore();
  });

  it('exits with error when session not found', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } });

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand(['diff', 'missing'])).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));

    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});
