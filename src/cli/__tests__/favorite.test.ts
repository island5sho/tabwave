import axios from "axios";
import { Command } from "commander";
import { createFavoriteCommand } from "../commands/favorite";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSession = (overrides = {}) => ({
  id: "sess-1",
  name: "My Session",
  tabs: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  favorite: true,
  ...overrides,
});

async function runCommand(...args: string[]) {
  const program = new Command();
  program.addCommand(createFavoriteCommand());
  await program.parseAsync(["node", "test", "favorite", ...args]);
}

describe("favorite command", () => {
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => undefined as never);
  });

  afterEach(() => jest.clearAllMocks());

  it("marks a session as favorite", async () => {
    mockedAxios.patch.mockResolvedValue({ data: mockSession({ favorite: true }) });
    await runCommand("sess-1");
    expect(consoleSpy).toHaveBeenCalledWith('Session "My Session" marked as favorite.');
  });

  it("unsets favorite with --unset flag", async () => {
    mockedAxios.patch.mockResolvedValue({ data: mockSession({ favorite: false }) });
    await runCommand("sess-1", "--unset");
    expect(consoleSpy).toHaveBeenCalledWith('Session "My Session" unfavorited.');
  });

  it("exits with error when session not found", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedAxios.patch.mockRejectedValue({ response: { status: 404 } });
    await runCommand("bad-id");
    expect(errSpy).toHaveBeenCalledWith('Session "bad-id" not found.');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits with generic error on failure", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedAxios.patch.mockRejectedValue({ message: "Network Error" });
    await runCommand("sess-1");
    expect(errSpy).toHaveBeenCalledWith("Failed to update favorite status:", "Network Error");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
