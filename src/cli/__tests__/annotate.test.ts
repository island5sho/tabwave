import axios from "axios";
import { Command } from "commander";
import { createAnnotateCommand } from "../commands/annotate";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSession = {
  id: "abc123",
  name: "Work Session",
  tabs: [],
  annotation: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createAnnotateCommand());
  program.exitOverride();
  await program.parseAsync(["node", "tabwave", "annotate", ...args]);
}

describe("annotate command", () => {
  let exitSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("sets an annotation on a session", async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      data: { ...mockSession, annotation: "Important project" },
    });

    await runCommand(["abc123", "--text", "Important project"]);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining("/sessions/abc123/annotate"),
      { annotation: "Important project" }
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Annotation set for session \"Work Session\""
    ));
  });

  it("clears an annotation with --clear", async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      data: { ...mockSession, annotation: "" },
    });

    await runCommand(["abc123", "--clear"]);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining("/sessions/abc123/annotate"),
      { annotation: "" }
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("Annotation cleared for session \"Work Session\"")
    );
  });

  it("exits with error when neither --text nor --clear provided", async () => {
    await expect(runCommand(["abc123"])).rejects.toThrow("exit");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("provide --text"));
  });

  it("exits with error on 404", async () => {
    mockedAxios.patch.mockRejectedValueOnce({ response: { status: 404 } });

    await expect(runCommand(["abc123", "--text", "hello"])).rejects.toThrow("exit");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("not found"));
  });
});
