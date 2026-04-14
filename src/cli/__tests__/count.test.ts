import { computeCount, printCount, CountResult } from "../commands/count";
import { TabSession } from "../../types/session";

function makeSession(overrides: Partial<TabSession> = {}): TabSession {
  return {
    id: "s1",
    name: "Test",
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    device: "laptop",
    tags: [],
    ...overrides,
  };
}

describe("computeCount", () => {
  it("returns zeros for empty list", () => {
    const result = computeCount([]);
    expect(result.total).toBe(0);
    expect(result.totalTabs).toBe(0);
    expect(result.byTag).toEqual({});
    expect(result.byDevice).toEqual({});
  });

  it("counts total sessions and tabs", () => {
    const sessions = [
      makeSession({ tabs: [{ url: "https://a.com", title: "A" }, { url: "https://b.com", title: "B" }] }),
      makeSession({ id: "s2", tabs: [{ url: "https://c.com", title: "C" }] }),
    ];
    const result = computeCount(sessions);
    expect(result.total).toBe(2);
    expect(result.totalTabs).toBe(3);
  });

  it("groups sessions by device", () => {
    const sessions = [
      makeSession({ device: "laptop" }),
      makeSession({ id: "s2", device: "laptop" }),
      makeSession({ id: "s3", device: "desktop" }),
    ];
    const result = computeCount(sessions);
    expect(result.byDevice["laptop"]).toBe(2);
    expect(result.byDevice["desktop"]).toBe(1);
  });

  it("groups sessions by tag", () => {
    const sessions = [
      makeSession({ tags: ["work", "urgent"] }),
      makeSession({ id: "s2", tags: ["work"] }),
      makeSession({ id: "s3", tags: [] }),
    ];
    const result = computeCount(sessions);
    expect(result.byTag["work"]).toBe(2);
    expect(result.byTag["urgent"]).toBe(1);
  });

  it("falls back to unknown device when device is missing", () => {
    const sessions = [makeSession({ device: undefined })];
    const result = computeCount(sessions);
    expect(result.byDevice["unknown"]).toBe(1);
  });
});

describe("printCount", () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => spy.mockRestore());

  it("prints total sessions and tabs", () => {
    const result: CountResult = { total: 3, totalTabs: 10, byTag: {}, byDevice: {} };
    printCount(result, false);
    expect(spy).toHaveBeenCalledWith("Sessions: 3");
    expect(spy).toHaveBeenCalledWith("Total tabs: 10");
  });

  it("prints breakdown when verbose", () => {
    const result: CountResult = {
      total: 2,
      totalTabs: 5,
      byTag: { work: 1 },
      byDevice: { laptop: 2 },
    };
    printCount(result, true);
    expect(spy).toHaveBeenCalledWith("  laptop: 2");
    expect(spy).toHaveBeenCalledWith("  work: 1");
  });

  it("does not print breakdown when not verbose", () => {
    const result: CountResult = {
      total: 1,
      totalTabs: 2,
      byTag: { work: 1 },
      byDevice: { laptop: 1 },
    };
    printCount(result, false);
    const calls = spy.mock.calls.map((c) => c[0]);
    expect(calls.some((c: string) => c.includes("laptop"))).toBe(false);
  });
});
