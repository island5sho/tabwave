import axios from "axios";
import { printAuditResult, AuditResult } from "../commands/audit";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("printAuditResult", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("prints success when no issues", () => {
    const result: AuditResult = { sessionId: "s1", name: "Work", issues: [] };
    printAuditResult(result);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No issues found"));
  });

  it("prints issues when present", () => {
    const result: AuditResult = {
      sessionId: "s2",
      name: "Research",
      issues: ["Duplicate tab URL(s): https://example.com"],
    };
    printAuditResult(result);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("1 issue(s)"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Duplicate tab URL"));
  });
});

describe("audit command", () => {
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("displays audit results for all sessions", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        results: [
          { sessionId: "s1", name: "Work", issues: [] },
          { sessionId: "s2", name: "Research", issues: ["Session has no tabs."] },
        ],
      },
    });

    const { createAuditCommand } = await import("../commands/audit");
    const cmd = createAuditCommand();
    await cmd.parseAsync([], { from: "user" });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Audit complete"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("2 session(s) checked"));
  });

  it("handles empty session list gracefully", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { results: [] } });

    const { createAuditCommand } = await import("../commands/audit");
    const cmd = createAuditCommand();
    await cmd.parseAsync([], { from: "user" });

    expect(consoleSpy).toHaveBeenCalledWith("No sessions found.");
  });

  it("exits with code 1 on request failure", async () => {
    mockedAxios.get.mockRejectedValueOnce({ message: "Network Error", response: undefined });

    const { createAuditCommand } = await import("../commands/audit");
    const cmd = createAuditCommand();
    await cmd.parseAsync([], { from: "user" });

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
