import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { createArchiveCommand } from '../commands/archive';

jest.mock('axios');
jest.mock('fs');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;

const mockSession = {
  id: 'sess-001',
  name: 'Work Tabs',
  tabs: [{ url: 'https://example.com', title: 'Example' }],
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('archive command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
    (mockedFs.mkdirSync as jest.Mock).mockImplementation();
    (mockedFs.writeFileSync as jest.Mock).mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('archives session and deletes it from server by default', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockSession });
    mockedAxios.delete.mockResolvedValue({ data: {} });

    const cmd = createArchiveCommand();
    await cmd.parseAsync(['node', 'archive', 'sess-001']);

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3000/sessions/sess-001');
    expect(mockedFs.writeFileSync).toHaveBeenCalled();
    expect(mockedAxios.delete).toHaveBeenCalledWith('http://localhost:3000/sessions/sess-001');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('archived to:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('removed from server'));
  });

  it('archives session but keeps it on server with --keep flag', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockSession });

    const cmd = createArchiveCommand();
    await cmd.parseAsync(['node', 'archive', 'sess-001', '--keep']);

    expect(mockedFs.writeFileSync).toHaveBeenCalled();
    expect(mockedAxios.delete).not.toHaveBeenCalled();
  });

  it('creates archive directory if it does not exist', async () => {
    (mockedFs.existsSync as jest.Mock).mockReturnValue(false);
    mockedAxios.get.mockResolvedValue({ data: mockSession });
    mockedAxios.delete.mockResolvedValue({ data: {} });

    const cmd = createArchiveCommand();
    await cmd.parseAsync(['node', 'archive', 'sess-001']);

    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it('prints error and exits when session is not found', async () => {
    mockedAxios.get.mockRejectedValue({ response: { status: 404 } });

    const cmd = createArchiveCommand();
    await expect(cmd.parseAsync(['node', 'archive', 'sess-999'])).rejects.toThrow('exit');

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('uses custom archive directory from --dir option', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockSession });
    mockedAxios.delete.mockResolvedValue({ data: {} });

    const cmd = createArchiveCommand();
    await cmd.parseAsync(['node', 'archive', 'sess-001', '--dir', '/tmp/my-archives']);

    const writeCall = (mockedFs.writeFileSync as jest.Mock).mock.calls[0];
    expect(writeCall[0]).toContain('/tmp/my-archives');
  });
});
