import axios from 'axios';
import { Command } from 'commander';
import { createSnapshotCommand } from '../commands/snapshot';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSession = {
  id: 'snapshot-abc123',
  name: 'Work Session — morning',
  tabs: [
    { id: 't1', url: 'https://example.com', title: 'Example', pinned: false },
  ],
  tags: ['snapshot'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createSnapshotCommand());
  program.exitOverride();
  return program.parseAsync(['node', 'tabwave', ...args]);
}

describe('snapshot command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a snapshot and prints details', async () => {
    mockedAxios.post = jest.fn().mockResolvedValue({ data: mockSession });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(['snapshot', 'session-1']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/session-1/snapshots'),
      { label: undefined }
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('snapshot-abc123'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('1'));
    spy.mockRestore();
  });

  it('creates a snapshot with a label', async () => {
    mockedAxios.post = jest.fn().mockResolvedValue({ data: mockSession });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(['snapshot', 'session-1', '--label', 'morning']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/session-1/snapshots'),
      { label: 'morning' }
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('morning'));
    spy.mockRestore();
  });

  it('prints error when session not found', async () => {
    mockedAxios.post = jest.fn().mockRejectedValue({ response: { status: 404 } });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(runCommand(['snapshot', 'missing-id'])).rejects.toThrow();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    spy.mockRestore();
    exitSpy.mockRestore();
  });
});
