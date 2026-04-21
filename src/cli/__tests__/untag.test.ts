import axios from "axios";
import { Command } from "commander";
import { createUntagCommand } from "../commands/untag";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, "exit").mockImplementation((code?: any) => {
  throw new Error(`process.exit(${code})`);
});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createUntagCommand());
  await program.parseAsync(["node", "test", ...args]);
}

describe("untag command", () => {
  beforeEach(() => jest.clearAllMocks());

  it("removes tags and logs remaining tags", async () => {
    mockedAxios.patch = jest.fn().mockResolvedValue({
      status: 200,
      data: { tags: ["work"] },
    });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await runCommand(["untag", "abc123", "personal"]);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      "http://localhost:3000/sessions/abc123/untag",
      { tags: ["personal"] }
    );
    expect(spy).toHaveBeenCalledWith("Tags removed. Remaining tags: work");
    spy.mockRestore();
  });

  it("logs message when no tags remain", async () => {
    mockedAxios.patch = jest.fn().mockResolvedValue({
      status: 200,
      data: { tags: [] },
    });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    await runCommand(["untag", "abc123", "work"]);

    expect(spy).toHaveBeenCalledWith("Tags removed. No tags remaining on session.");
    spy.mockRestore();
  });

  it("exits with error when session is not found", async () => {
    mockedAxios.patch = jest.fn().mockRejectedValue({
      response: { status: 404 },
      message: "Not Found",
    });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(runCommand(["untag", "missing", "work"])).rejects.toThrow("process.exit(1)");
    expect(spy).toHaveBeenCalledWith(`Session "missing" not found.`);
    spy.mockRestore();
  });

  it("exits with error on bad request", async () => {
    mockedAxios.patch = jest.fn().mockRejectedValue({
      response: { status: 400, data: { error: "tags must be a non-empty array" } },
      message: "Bad Request",
    });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(runCommand(["untag", "abc123"])).rejects.toThrow();
    spy.mockRestore();
  });

  it("uses custom port when specified", async () => {
    mockedAxios.patch = jest.fn().mockResolvedValue({
      status: 200,
      data: { tags: [] },
    });
    jest.spyOn(console, "log").mockImplementation(() => {});

    await runCommand(["untag", "abc123", "work", "--port", "4000"]);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      "http://localhost:4000/sessions/abc123/untag",
      { tags: ["work"] }
    );
  });
});
