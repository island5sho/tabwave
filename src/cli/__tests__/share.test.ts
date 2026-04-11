import axios from 'axios';
import { Command } from 'commander';
import { createShareCommand } from '../commands/share';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const HOST = 'http://localhost:3000';

async function runCommand(args: string[]): Promise<{ stdout: string; exitCode: number }> {
  const logs: string[] = [];
  const errors: string[] = [];
  const spyLog = jest.spyOn(console, 'log').mockImplementation((msg) => logs.push(msg));
  const spyErr = jest.spyOn(console, 'error').mockImplementation((msg) => errors.push(msg));
  const spyExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

  const program = new Command();
  program.addCommand(createShareCommand());
  await program.parseAsync(['node', 'tabwave', 'share', ...args]);

  spyLog.mockRestore();
  spyErr.mockRestore();
  spyExit.mockRestore();

  return { stdout: [...logs, ...errors].join('\n'), exitCode: (spyExit.mock.calls[0]?.[0] as number) ?? 0 };
}

describe('share command', () => {
  const expiresAt = Date.now() + 3600 * 1000;

  beforeEach(() => jest.clearAllMocks());

  it('prints share URL and expiry on success', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'abc.xyz', expiresAt, readonly: false },
    });

    const { stdout, exitCode } = await runCommand(['session-1']);
    expect(stdout).toContain(`${HOST}/shared/abc.xyz`);
    expect(stdout).toContain('Expires at:');
    expect(exitCode).toBe(0);
  });

  it('shows read-only label when --readonly flag is set', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'tok.sig', expiresAt, readonly: true },
    });

    const { stdout } = await runCommand(['session-1', '--readonly']);
    expect(stdout).toContain('read-only');
  });

  it('passes custom ttl to the server', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'tok.sig', expiresAt, readonly: false },
    });

    await runCommand(['session-1', '--ttl', '7200']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/session-1/share'),
      expect.objectContaining({ ttl: 7200 })
    );
  });

  it('exits with error when session not found (404)', async () => {
    mockedAxios.post.mockRejectedValueOnce({ response: { status: 404 } });

    const { stdout, exitCode } = await runCommand(['missing-id']);
    expect(stdout).toContain("Session 'missing-id' not found");
    expect(exitCode).toBe(1);
  });

  it('exits with error on invalid ttl', async () => {
    const { stdout, exitCode } = await runCommand(['session-1', '--ttl', 'bad']);
    expect(stdout).toContain('--ttl must be a positive integer');
    expect(exitCode).toBe(1);
  });
});
