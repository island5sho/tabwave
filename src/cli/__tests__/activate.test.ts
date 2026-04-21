import axios from "axios";
import { createActivateCommand } from "../commands/activate";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit");
});

const mockLog = jest.spyOn(console, "log").mockImplementation(() => {});
const mockError = jest.spyOn(console, "error").mockImplementation(() => {});

async function runCommand(args: string[]) {
  const cmd = createActivateCommand();
  await cmd.parseAsync(["node", "activate", ...args]);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("activate command", () => {
  it("activates a session by id", async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      data: { id: "abc123", name: "Work Tabs", active: true },
    });

    await runCommand(["abc123"]);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      "http://localhost:3000/sessions/abc123/activate",
      { deactivateOthers: false }
    );
    expect(mockLog).toHaveBeenCalledWith('✓ Session "Work Tabs" is now active.');
  });

  it("activates with --deactivate-others flag", async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      data: { id: "abc123", name: "Work Tabs", active: true },
    });

    await runCommand(["abc123", "--deactivate-others"]);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      "http://localhost:3000/sessions/abc123/activate",
      { deactivateOthers: true }
    );
    expect(mockLog).toHaveBeenCalledWith(
      "  All other sessions have been deactivated."
    );
  });

  it("prints error and exits when session not found", async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      response: { status: 404 },
      message: "Not Found",
    });

    await expect(runCommand(["missing-id"])).rejects.toThrow("process.exit");
    expect(mockError).toHaveBeenCalledWith('Error: Session "missing-id" not found.');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("prints generic error and exits on unexpected failure", async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      message: "Network Error",
    });

    await expect(runCommand(["abc123"])).rejects.toThrow("process.exit");
    expect(mockError).toHaveBeenCalledWith("Error activating session:", "Network Error");
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
