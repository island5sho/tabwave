import { trimTabs } from "../commands/trim";
import { TabSession } from "../../types/session";

function makeSession(tabCount: number): TabSession {
  return {
    id: "session-1",
    name: "Test Session",
    tabs: Array.from({ length: tabCount }, (_, i) => ({
      id: `tab-${i}`,
      url: `https://example.com/${i}`,
      title: `Tab ${i}`,
    })),
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    tags: [],
  };
}

describe("trimTabs", () => {
  it("returns session unchanged when tabs <= maxTabs", () => {
    const session = makeSession(3);
    const { trimmed, removed } = trimTabs(session, 5);
    expect(removed).toBe(0);
    expect(trimmed.tabs).toHaveLength(3);
  });

  it("returns session unchanged when tabs === maxTabs", () => {
    const session = makeSession(5);
    const { trimmed, removed } = trimTabs(session, 5);
    expect(removed).toBe(0);
    expect(trimmed.tabs).toHaveLength(5);
  });

  it("trims tabs to maxTabs when over limit", () => {
    const session = makeSession(10);
    const { trimmed, removed } = trimTabs(session, 4);
    expect(removed).toBe(6);
    expect(trimmed.tabs).toHaveLength(4);
  });

  it("keeps the first N tabs in order", () => {
    const session = makeSession(5);
    const { trimmed } = trimTabs(session, 2);
    expect(trimmed.tabs[0].id).toBe("tab-0");
    expect(trimmed.tabs[1].id).toBe("tab-1");
  });

  it("updates updatedAt on trimmed session", () => {
    const session = makeSession(5);
    const before = session.updatedAt;
    const { trimmed } = trimTabs(session, 2);
    expect(trimmed.updatedAt).not.toBe(before);
  });

  it("does not mutate the original session", () => {
    const session = makeSession(5);
    trimTabs(session, 2);
    expect(session.tabs).toHaveLength(5);
  });

  it("trims to 1 tab correctly", () => {
    const session = makeSession(8);
    const { trimmed, removed } = trimTabs(session, 1);
    expect(trimmed.tabs).toHaveLength(1);
    expect(removed).toBe(7);
  });
});
