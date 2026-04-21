import axios from 'axios';
import { Command } from 'commander';
import { createUnpublishCommand } from '../commands/unpublish';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockProcessExit = jest
  .spyOn(process, 'exit')
  .mockImplementation((() => {}) as any);

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createUnpublishCommand());
  await program.parseAsync(['node', 'tabwave', 'unpublish', ...args]);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('unpublish command', () => {
  it('revokes a share link successfully', async () => {
    mockedAxios.delete = jest.fn().mockResolvedValue({ status: 200 });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(['abc123']);

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/abc123/share'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Share link for session "abc123" has been revoked.'
    );
    expect(mockProcessExit).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('uses custom host when provided', async () => {
    mockedAxios.delete = jest.fn().mockResolvedValue({ status: 200 });
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(['abc123', '--host', 'http://localhost:4000']);

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      'http://localhost:4000/sessions/abc123/share'
    );
  });

  it('exits with error when session is not found', async () => {
    mockedAxios.delete = jest.fn().mockRejectedValue({
      response: { status: 404 }
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await runCommand(['missing-id']);

    expect(errorSpy).toHaveBeenCalledWith('Session "missing-id" not found.');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    errorSpy.mockRestore();
  });

  it('exits with error when session has no active share link', async () => {
    mockedAxios.delete = jest.fn().mockRejectedValue({
      response: { status: 409 }
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await runCommand(['no-share-id']);

    expect(errorSpy).toHaveBeenCalledWith(
      'Session "no-share-id" has no active share link.'
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    errorSpy.mockRestore();
  });

  it('exits with generic error on unexpected failure', async () => {
    mockedAxios.delete = jest.fn().mockRejectedValue({
      response: { status: 500, data: { error: 'Internal Server Error' } }
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await runCommand(['some-id']);

    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to unpublish session:',
      'Internal Server Error'
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    errorSpy.mockRestore();
  });
});
