import axios from "axios";
import { Command } from "commander";
import { createFreezeCommand } from "../commands/freeze";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit");
});

const mockLog = jest.spyOn(console, "log").mockImplementation(() => {});
const mockError = jest.spyOn(console, "error").mockImplementation(() => {});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createFreezeCommand());
  await program.parseAsync(["node", "test", ...args]);
}

describe("freeze command", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("freezes a session by ID", async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      data: { id: "abc123", name: "Work Tabs", frozen: true },
    });

    await runCommand(["freeze", "abc123"]);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      "http://localhost:3000/sessions/abc123/freeze",
      { frozen: true }
    );
    expect(mockLog).toHaveBeenCalledWith(
      'Session "Work Tabs" (abc123) is now frozen.'
    );
  });

  it("unfreezes a session when --unfreeze flag is passed", async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      data: { id: "abc123", name: "Work Tabs", frozen: false },
    });

    await runCommand(["freeze", "abc123", "--unfreeze"]);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      "http://localhost:3000/sessions/abc123/freeze",
      { frozen: false }
    );
    expect(mockLog).toHaveBeenCalledWith(
      'Session "Work Tabs" (abc123) is now unfrozen.'
    );
  });

  it("uses custom port when --port is provided", async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      data: { id: "xyz", name: "Dev", frozen: true },
    });

    await runCommand(["freeze", "xyz", "--port", "4000"]);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      "http://localhost:4000/sessions/xyz/freeze",
      { frozen: true }
    );
  });

  it("prints error and exits on 404", async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      response: { status: 404 },
      message: "Not Found",
    });

    await expect(runCommand(["freeze", "missing"])).rejects.toThrow("process.exit");
    expect(mockError).toHaveBeenCalledWith("Session not found: missing");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("prints generic error and exits on other failures", async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      message: "Network Error",
    });

    await expect(runCommand(["freeze", "abc123"])).rejects.toThrow("process.exit");
    expect(mockError).toHaveBeenCalledWith("Failed to freeze session:", "Network Error");
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
