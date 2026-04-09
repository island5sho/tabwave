import { createExportCommand } from '../commands/export';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('axios');
jest.mock('fs');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;

const mockSession = {
  id: 'session-abc',
  name: 'Work Session',
  tabs: [
    { id: 't1', url: 'https://github.com', title: 'GitHub', pinned: false },
    { id: 't2', url: 'https://notion.so', title: 'Notion', pinned: true },
  ],
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-02T12:00:00Z',
};

describe('export command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('exports session to default filename', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: mockSession });
    mockedFs.writeFileSync = jest.fn();

    const cmd = createExportCommand();
    await cmd.parseAsync(['node', 'export', 'session-abc']);

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3000/sessions/session-abc');
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      path.resolve(process.cwd(), 'session-abc.json'),
      JSON.stringify(mockSession),
      'utf-8'
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Work Session'));
  });

  it('exports session to custom output file with pretty print', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: mockSession });
    mockedFs.writeFileSync = jest.fn();

    const cmd = createExportCommand();
    await cmd.parseAsync(['node', 'export', 'session-abc', '-o', 'output.json', '--pretty']);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      path.resolve(process.cwd(), 'output.json'),
      JSON.stringify(mockSession, null, 2),
      'utf-8'
    );
  });

  it('handles 404 session not found', async () => {
    const error = { response: { status: 404 }, message: 'Not Found' };
    mockedAxios.get = jest.fn().mockRejectedValue(error);
    mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

    const cmd = createExportCommand();
    await expect(cmd.parseAsync(['node', 'export', 'missing-id'])).rejects.toThrow('process.exit');

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('handles generic network error', async () => {
    mockedAxios.get = jest.fn().mockRejectedValue(new Error('Network Error'));

    const cmd = createExportCommand();
    await expect(cmd.parseAsync(['node', 'export', 'session-abc'])).rejects.toThrow('process.exit');

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error exporting session'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
