import { computeStats, printStats, SessionStats } from "../commands/stats";
import { TabSession } from "../../types/session";

const mockSessions: TabSession[] = [
  {
    id: "s1",
    name: "Work",
    tabs: [
      { url: "https://a.com", title: "A" },
      { url: "https://b.com", title: "B" },
    ],
    tags: ["work", "dev"],
    pinned: true,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "s2",
    name: "Personal",
    tabs: [{ url: "https://c.com", title: "C" }],
    tags: ["work"],
    pinned: false,
    archived: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "s3",
    name: "Empty",
    tabs: [],
    tags: [],
    pinned: false,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe("computeStats", () => {
  it("counts total sessions", () => {
    const stats = computeStats(mockSessions);
    expect(stats.totalSessions).toBe(3);
  });

  it("counts total tabs", () => {
    const stats = computeStats(mockSessions);
    expect(stats.totalTabs).toBe(3);
  });

  it("counts archived sessions", () => {
    const stats = computeStats(mockSessions);
    expect(stats.archivedSessions).toBe(1);
  });

  it("counts pinned sessions", () => {
    const stats = computeStats(mockSessions);
    expect(stats.pinnedSessions).toBe(1);
  });

  it("counts tagged sessions", () => {
    const stats = computeStats(mockSessions);
    expect(stats.taggedSessions).toBe(2);
  });

  it("calculates average tabs per session", () => {
    const stats = computeStats(mockSessions);
    expect(stats.avgTabsPerSession).toBe(1);
  });

  it("returns most used tags sorted by count", () => {
    const stats = computeStats(mockSessions);
    expect(stats.mostUsedTags[0].tag).toBe("work");
    expect(stats.mostUsedTags[0].count).toBe(2);
  });

  it("includes all unique tags in mostUsedTags", () => {
    const stats = computeStats(mockSessions);
    const tagNames = stats.mostUsedTags.map((t) => t.tag);
    expect(tagNames).toContain("work");
    expect(tagNames).toContain("dev");
  });

  it("handles empty sessions array", () => {
    const stats = computeStats([]);
    expect(stats.totalSessions).toBe(0);
    expect(stats.avgTabsPerSession).toBe(0);
    expect(stats.mostUsedTags).toHaveLength(0);
  });

  it("handles sessions with no tags", () => {
    const stats = computeStats([mockSessions[2]]);
    expect(stats.taggedSessions).toBe(0);
    expect(stats.mostUsedTags).toHaveLength(0);
  });
});

describe("printStats", () => {
  it("prints stats without throwing", () => {
    const stats: SessionStats = {
      totalSessions: 2,
      totalTabs: 5,
      archivedSessions: 1,
      pinnedSessions: 0,
      taggedSessions: 1,
      avgTabsPerSession: 2.5,
      mostUsedTags: [{ tag: "dev", count: 3 }],
    };
    expect(() => printStats(stats)).not.toThrow();
  });
});
