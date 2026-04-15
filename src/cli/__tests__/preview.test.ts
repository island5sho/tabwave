import axios from "axios";
import { printPreview, createPreviewCommand } from "../commands/preview";
import { TabSession } from "../../types/session";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeSession(overrides: Partial<TabSession> = {}): TabSession {
  return {
    id: "sess-1",
    name: "My Session",
    tabs: [
      { url: "https://example.com", title: "Example" },
      { url: "https://github.com", title: "GitHub" },
      { url: "https://news.ycombinator.com", title: "Hacker News" },
    ],
    tags: ["work"],
    label: undefined,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
    ...overrides,
  } as TabSession;
}

describe("printPreview", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("prints session info and tabs", () => {
    printPreview(makeSession(), 5);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("My Session"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Example"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("GitHub"));
  });

  it("limits tab display to maxTabs", () => {
    printPreview(makeSession(), 1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("2 more tab(s)"));
  });

  it("shows tags when present", () => {
    printPreview(makeSession({ tags: ["work", "research"] }), 5);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("work, research"));
  });

  it("shows label when present", () => {
    printPreview(makeSession({ label: "important" } as any), 5);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("important"));
  });

  it("does not show remaining line when all tabs fit", () => {
    printPreview(makeSession(), 10);
    const calls = consoleSpy.mock.calls.map((c) => c[0]);
    expect(calls.some((c) => typeof c === "string" && c.includes("more tab"))).toBe(false);
  });
});

describe("createPreviewCommand", () => {
  let exitSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches and prints session on success", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: makeSession() });
    const cmd = createPreviewCommand();
    await cmd.parseAsync(["node", "preview", "sess-1"]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("My Session"));
  });

  it("exits with error on 404", async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } });
    const cmd = createPreviewCommand();
    await expect(cmd.parseAsync(["node", "preview", "missing-id"])).rejects.toThrow("exit");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("not found"));
  });

  it("exits with error on invalid --max-tabs", async () => {
    const cmd = createPreviewCommand();
    await expect(cmd.parseAsync(["node", "preview", "sess-1", "--max-tabs", "abc"])).rejects.toThrow("exit");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("positive integer"));
  });
});
