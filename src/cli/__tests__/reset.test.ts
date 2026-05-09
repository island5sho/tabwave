import axios from "axios";
import * as readline from "readline";
import { createResetCommand } from "../commands/reset";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("readline");
const mockedReadline = readline as jest.Mocked<typeof readline>;

const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit");
});

function runCommand(args: string[]): Promise<void> {
  const cmd = createResetCommand();
  return cmd.parseAsync(args, { from: "user" });
}

describe("reset command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resets all sessions with --force flag", async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: { deleted: 5 } });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await runCommand(["--force"]);

    expect(mockedAxios.delete).toHaveBeenCalledWith(
      expect.stringContaining("/sessions/reset")
    );
    expect(spy).toHaveBeenCalledWith("Reset complete. 5 session(s) removed.");
    spy.mockRestore();
  });

  it("cancels when user declines confirmation", async () => {
    const rl = {
      question: (_: string, cb: (a: string) => void) => cb("n"),
      close: jest.fn(),
    };
    (mockedReadline.createInterface as jest.Mock).mockReturnValue(rl);

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await expect(runCommand([])).rejects.toThrow("process.exit");
    expect(spy).toHaveBeenCalledWith("Reset cancelled.");
    expect(mockedAxios.delete).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("proceeds when user confirms", async () => {
    const rl = {
      question: (_: string, cb: (a: string) => void) => cb("y"),
      close: jest.fn(),
    };
    (mockedReadline.createInterface as jest.Mock).mockReturnValue(rl);
    mockedAxios.delete.mockResolvedValueOnce({ data: { deleted: 3 } });

    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runCommand([]);

    expect(mockedAxios.delete).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith("Reset complete. 3 session(s) removed.");
    spy.mockRestore();
  });

  it("prints error and exits on server failure", async () => {
    mockedAxios.delete.mockRejectedValueOnce({
      response: { data: { error: "server error" } },
    });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(runCommand(["--force"])).rejects.toThrow("process.exit");
    expect(spy).toHaveBeenCalledWith("Error: server error");
    spy.mockRestore();
  });
});
