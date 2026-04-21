import express from "express";
import request from "supertest";
import { registerFocusRoute } from "../session-router-focus";
import { SessionStore } from "../../storage/session-store";

function buildApp(store: SessionStore) {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerFocusRoute(router, store);
  app.use("/sessions", router);
  return app;
}

function makeSession(id: string, name: string, focused = false) {
  return {
    id,
    name,
    tabs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { focused },
  };
}

describe("POST /sessions/:id/focus", () => {
  let store: jest.Mocked<SessionStore>;

  beforeEach(() => {
    store = {
      get: jest.fn(),
      save: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<SessionStore>;
  });

  it("returns 404 if session not found", async () => {
    store.get.mockResolvedValueOnce(null);
    const app = buildApp(store);
    const res = await request(app).post("/sessions/missing/focus");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("focuses the session and returns result", async () => {
    const session = makeSession("s1", "Work");
    store.get.mockResolvedValueOnce(session);
    store.list.mockResolvedValueOnce([session]);
    store.save.mockResolvedValue(undefined);

    const app = buildApp(store);
    const res = await request(app).post("/sessions/s1/focus");

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe("s1");
    expect(res.body.name).toBe("Work");
    expect(res.body.previousFocus).toBeNull();
    expect(res.body.focusedAt).toBeDefined();
  });

  it("clears previously focused session and reports it", async () => {
    const focused = makeSession("s0", "Research", true);
    const target = makeSession("s1", "Work", false);

    store.get.mockResolvedValueOnce(target);
    store.list.mockResolvedValueOnce([focused, target]);
    store.save.mockResolvedValue(undefined);

    const app = buildApp(store);
    const res = await request(app).post("/sessions/s1/focus");

    expect(res.status).toBe(200);
    expect(res.body.previousFocus).toBe("Research");
    expect(store.save).toHaveBeenCalledTimes(2);
  });
});
