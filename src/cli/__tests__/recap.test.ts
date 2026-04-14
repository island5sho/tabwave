import { formatRecap } from "../commands/recap";
import { TabSession } from "../../types/session";

function makeSession(
  name: string,
  tabCount: number,
  overrides: Partial<TabSession> = {}
): TabSession {
  return {
    id: name,
    name,
    tabs: Array.from({ length: tabCount }, (_, i) => ({
      url: `https://example.com/${i}`,
      title: `Tab ${i}`,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false,
    archived: false,
    tags: [],
    ...overrides,
  };
}

describe("formatRecap", () => {
  it("returns a message when no sessions exist", () => {
    expect(formatRecap([])).toBe("No sessions found.");
  });

  it("includes total sessions and tabs", () => {
    const sessions = [makeSession("work", 3), makeSession("home", 5)];
    const output = formatRecap(sessions);
    expect(output).toContain("Total sessions : 2");
    expect(output).toContain("Total tabs     : 8");
  });

  it("counts pinned sessions", () => {
    const sessions = [
      makeSession("a", 2, { pinned: true }),
      makeSession("b", 1),
    ];
    expect(formatRecap(sessions)).toContain("Pinned         : 1");
  });

  it("counts archived sessions", () => {
    const sessions = [
      makeSession("a", 2, { archived: true }),
      makeSession("b", 1, { archived: true }),
    ];
    expect(formatRecap(sessions)).toContain("Archived       : 2");
  });

  it("counts tagged sessions", () => {
    const sessions = [
      makeSession("a", 2, { tags: ["dev"] }),
      makeSession("b", 1),
    ];
    expect(formatRecap(sessions)).toContain("Tagged         : 1");
  });

  it("shows the session with the most tabs", () => {
    const sessions = [makeSession("small", 2), makeSession("big", 10)];
    expect(formatRecap(sessions)).toContain('"big" (10 tabs)');
  });

  it("calculates average tabs per session", () => {
    const sessions = [makeSession("a", 4), makeSession("b", 6)];
    expect(formatRecap(sessions)).toContain("Avg tabs/sess  : 5.0");
  });
});
