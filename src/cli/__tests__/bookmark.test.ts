import axios from "axios";
import { Command } from "commander";
import { createBookmarkCommand } from "../commands/bookmark";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const runCommand = async (args: string[]): Promise<void> => {
  const program = new Command();
  program.addCommand(createBookmarkCommand());
  program.exitOverride();
  await program.parseAsync(["node", "test", ...args]);
};

const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit");
});

describe("bookmark command", () => {
  beforeEach(() => jest.clearAllMocks());

  it("adds a bookmark to a session", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { bookmarks: [{ url: "https://example.com" }] } });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runCommand(["bookmark", "session-1", "https://example.com"]);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining("/sessions/session-1/bookmarks"),
      { url: "https://example.com" }
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Bookmarked"));
    spy.mockRestore();
  });

  it("adds a bookmark with a label", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { bookmarks: [] } });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runCommand(["bookmark", "session-1", "https://example.com", "--label", "My Site"]);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      { url: "https://example.com", label: "My Site" }
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('"My Site"'));
    spy.mockRestore();
  });

  it("lists bookmarks with --list flag", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { bookmarks: [{ url: "https://a.com", label: "A" }, { url: "https://b.com" }] },
    });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runCommand(["bookmark", "session-1", "unused", "--list"]);
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("https://a.com"));
    spy.mockRestore();
  });

  it("removes a bookmark with --remove flag", async () => {
    mockedAxios.delete.mockResolvedValueOnce({ data: { bookmarks: [] } });
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    await runCommand(["bookmark", "session-1", "https://example.com", "--remove"]);
    expect(mockedAxios.delete).toHaveBeenCalledWith(
      expect.stringContaining("/sessions/session-1/bookmarks"),
      { data: { url: "https://example.com" } }
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("removed"));
    spy.mockRestore();
  });

  it("logs error and exits on failure", async () => {
    mockedAxios.post.mockRejectedValueOnce({ response: { data: { error: "Not found" } } });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(runCommand(["bookmark", "bad-id", "https://x.com"])).rejects.toThrow();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Not found"));
    spy.mockRestore();
  });
});
