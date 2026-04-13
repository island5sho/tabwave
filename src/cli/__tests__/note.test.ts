import axios from "axios";
import { Command } from "commander";
import { createNoteCommand } from "../commands/note";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockProcessExit = jest.spyOn(process, "exit").mockImplementation((code?: any) => {
  throw new Error(`process.exit(${code})`);
});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createNoteCommand());
  await program.parseAsync(["node", "tabwave", "note", ...args]);
}

beforeEach(() => jest.clearAllMocks());

describe("note command", () => {
  it("displays note when no flag given and note exists", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { id: "s1", note: "my note" } });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runCommand(["s1"]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("my note"));
    spy.mockRestore();
  });

  it("displays fallback when note is absent", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { id: "s1" } });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runCommand(["s1"]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("No note set"));
    spy.mockRestore();
  });

  it("sets a note with --set flag", async () => {
    mockedAxios.patch.mockResolvedValueOnce({ status: 200, data: {} });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runCommand(["s1", "--set", "hello world"]);
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining("/sessions/s1/note"),
      { note: "hello world" }
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Note updated"));
    spy.mockRestore();
  });

  it("clears note with --clear flag", async () => {
    mockedAxios.patch.mockResolvedValueOnce({ status: 200, data: {} });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runCommand(["s1", "--clear"]);
    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining("/sessions/s1/note"),
      { note: null }
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Note cleared"));
    spy.mockRestore();
  });

  it("exits with 1 when session not found", async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 }, message: "Not Found" });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(runCommand(["missing"])).rejects.toThrow("process.exit(1)");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("not found"));
    spy.mockRestore();
  });

  it("exits with 1 on generic error", async () => {
    mockedAxios.get.mockRejectedValueOnce({ message: "Network Error" });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(runCommand(["s1"])).rejects.toThrow("process.exit(1)");
    expect(spy).toHaveBeenCalledWith("Error:", "Network Error");
    spy.mockRestore();
  });
});
