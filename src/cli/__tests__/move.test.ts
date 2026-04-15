import axios from "axios";
import { Command } from "commander";
import { createMoveCommand } from "../commands/move";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, "exit").mockImplementation((() => {}) as any);
const mockLog = jest.spyOn(console, "log").mockImplementation(() => {});
const mockError = jest.spyOn(console, "error").mockImplementation(() => {});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createMoveCommand());
  await program.parseAsync(["node", "test", "move", ...args]);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("move command", () => {
  it("moves a tab and prints confirmation", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { tab: { title: "GitHub", url: "https://github.com" }, targetSession: "work" },
    });

    await runCommand(["personal", "0", "work"]);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/sessions/move"),
      { sourceSession: "personal", tabIndex: 0, targetSession: "work", position: undefined }
    );
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Moved \"GitHub\" to session \"work\""));
  });

  it("includes position in message when --position is given", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { tab: { title: "MDN", url: "https://mdn.io" }, targetSession: "research" },
    });

    await runCommand(["personal", "1", "research", "--position", "2"]);

    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("at position 2"));
  });

  it("exits with error on invalid tabIndex", async () => {
    await runCommand(["personal", "abc", "work"]);

    expect(mockError).toHaveBeenCalledWith(expect.stringContaining("tabIndex must be a non-negative integer"));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("exits with error when server returns 404", async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Session "personal" not found.' } },
    });

    await runCommand(["personal", "0", "work"]);

    expect(mockError).toHaveBeenCalledWith(expect.stringContaining("Session \"personal\" not found."));
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
