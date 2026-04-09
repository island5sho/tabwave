import axios from 'axios';
import chalk from 'chalk';
import { createDeleteCommand } from '../commands/delete';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Suppress chalk colors in test output
beforeAll(() => {
  chalk.level = 0;
});

describe('delete command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a session successfully with --force flag', async () => {
    mockedAxios.delete = jest.fn().mockResolvedValueOnce({ status: 200 });

    const cmd = createDeleteCommand();
    await cmd.parseAsync(['node', 'test', 'session-abc', '--force']);

    expect(mockedAxios.delete).toHaveBeenCalledWith('http://localhost:3000/sessions/session-abc');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('deleted successfully'));
  });

  it('uses custom host when --host is provided', async () => {
    mockedAxios.delete = jest.fn().mockResolvedValueOnce({ status: 200 });

    const cmd = createDeleteCommand();
    await cmd.parseAsync(['node', 'test', 'session-xyz', '--force', '--host', 'http://localhost:4000']);

    expect(mockedAxios.delete).toHaveBeenCalledWith('http://localhost:4000/sessions/session-xyz');
  });

  it('logs a not-found error when server returns 404', async () => {
    mockedAxios.delete = jest.fn().mockRejectedValueOnce({
      response: { status: 404 },
      message: 'Not Found',
    });

    const cmd = createDeleteCommand();
    await cmd.parseAsync(['node', 'test', 'missing-id', '--force']);

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('logs a generic error on unexpected failure', async () => {
    mockedAxios.delete = jest.fn().mockRejectedValueOnce(new Error('Network error'));

    const cmd = createDeleteCommand();
    await cmd.parseAsync(['node', 'test', 'session-abc', '--force']);

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to delete session'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
