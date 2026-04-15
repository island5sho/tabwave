import axios from "axios";
import { printSummary } from "../commands/summary";
import { TabSession } from "../../types/session";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeSession(overrides: Partial<TabSession> = {}): TabSession {
  return {
    id: "s1",
    name: "Session 1",
    tabs: [{ url: "https://a.com", title: "A" }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    pinned: false,
    archived: false,
    locked: false,
    ...overrides,
  };
}

describe("printSummary", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("prints no sessions message when empty", () => {
    printSummary([]);
    expect(consoleSpy).toHaveBeenCalledWith("No sessions found.");
  });

  it("prints total sessions and tabs", () => {
    const sessions = [
      makeSession({ id: "s1", tabs: [{ url: "https://a.com", title: "A" }, { url: "https://b.com", title: "B" }] }),
      makeSession({ id: "s2", tabs: [{ url: "https://c.com", title: "C" }] }),
    ];
    printSummary(sessions);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Total sessions : 2");
    expect(output).toContain("Total tabs     : 3");
    expect(output).toContain("Avg tabs/session: 1.5");
  });

  it("counts pinned, archived, locked sessions", () => {
    const sessions = [
      makeSession({ id: "s1", pinned: true }),
      makeSession({ id: "s2", archived: true }),
      makeSession({ id: "s3", locked: true }),
      makeSession({ id: "s4" }),
    ];
    printSummary(sessions);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("Pinned         : 1");
    expect(output).toContain("Archived       : 1");
    expect(output).toContain("Locked         : 1");
  });

  it("shows top tags sorted by frequency", () => {
    const sessions = [
      makeSession({ id: "s1", tags: ["work", "dev"] }),
      makeSession({ id: "s2", tags: ["work", "research"] }),
      makeSession({ id: "s3", tags: ["work"] }),
    ];
    printSummary(sessions);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("work(3)");
    expect(output).toContain("Top tags");
  });

  it("shows the most recently updated session", () => {
    const older = makeSession({ id: "s1", name: "Old", updatedAt: "2024-01-01T00:00:00.000Z" });
    const newer = makeSession({ id: "s2", name: "New", updatedAt: "2024-06-01T00:00:00.000Z" });
    printSummary([older, newer]);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(output).toContain("New");
  });
});
