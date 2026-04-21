import axios from "axios";
import { createFocusCommand, printFocusResult, FocusResult } from "../commands/focus";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit");
});

describe("printFocusResult", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => consoleSpy.mockRestore());

  it("prints focused session without previous focus", () => {
    const result: FocusResult = {
      sessionId: "abc",
      name: "Work",
      focusedAt: new Date("2024-01-01T10:00:00Z").toISOString(),
      previousFocus: null,
    };
    printFocusResult(result);
    expect(consoleSpy).toHaveBeenCalledWith("Focused session: Work (abc)");
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining("Unfocused"));
  });

  it("prints unfocused previous session", () => {
    const result: FocusResult = {
      sessionId: "abc",
      name: "Work",
      focusedAt: new Date("2024-01-01T10:00:00Z").toISOString(),
      previousFocus: "Research",
    };
    printFocusResult(result);
    expect(consoleSpy).toHaveBeenCalledWith("Unfocused: Research");
    expect(consoleSpy).toHaveBeenCalledWith("Focused session: Work (abc)");
  });
});

describe("createFocusCommand", () => {
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("calls POST /sessions/:id/focus and prints result", async () => {
    const result: FocusResult = {
      sessionId: "s1",
      name: "Dev",
      focusedAt: new Date().toISOString(),
      previousFocus: null,
    };
    mockedAxios.post.mockResolvedValueOnce({ data: result });

    const cmd = createFocusCommand();
    await cmd.parseAsync(["node", "focus", "s1"]);

    expect(mockedAxios.post).toHaveBeenCalledWith("http://localhost:3000/sessions/s1/focus");
    expect(consoleSpy).toHaveBeenCalledWith("Focused session: Dev (s1)");
  });

  it("exits with error on failure", async () => {
    mockedAxios.post.mockRejectedValueOnce({ response: { data: { error: "Not found" } } });

    const cmd = createFocusCommand();
    await expect(cmd.parseAsync(["node", "focus", "missing"])).rejects.toThrow("process.exit");
    expect(errorSpy).toHaveBeenCalledWith("Error: Not found");
  });

  it("suppresses output with --quiet", async () => {
    const result: FocusResult = {
      sessionId: "s1",
      name: "Dev",
      focusedAt: new Date().toISOString(),
      previousFocus: null,
    };
    mockedAxios.post.mockResolvedValueOnce({ data: result });

    const cmd = createFocusCommand();
    await cmd.parseAsync(["node", "focus", "s1", "--quiet"]);
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
