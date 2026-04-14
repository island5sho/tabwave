import express from "express";
import request from "supertest";
import { registerFavoriteRoute } from "../session-router-favorite";
import { SessionStore } from "../../storage/session-store";

const makeSession = (overrides = {}) => ({
  id: "sess-1",
  name: "Test Session",
  tabs: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  favorite: false,
  ...overrides,
});

function buildApp(store: Partial<SessionStore>) {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerFavoriteRoute(router, store as SessionStore);
  app.use(router);
  return app;
}

describe("registerFavoriteRoute", () => {
  it("marks a session as favorite", async () => {
    const session = makeSession();
    const store = {
      get: jest.fn().mockResolvedValue(session),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const app = buildApp(store);
    const res = await request(app)
      .patch("/sessions/sess-1/favorite")
      .send({ favorite: true });
    expect(res.status).toBe(200);
    expect(res.body.favorite).toBe(true);
    expect(store.save).toHaveBeenCalledWith(expect.objectContaining({ favorite: true }));
  });

  it("returns 404 when session not found", async () => {
    const store = { get: jest.fn().mockResolvedValue(null), save: jest.fn() };
    const app = buildApp(store);
    const res = await request(app)
      .patch("/sessions/missing/favorite")
      .send({ favorite: true });
    expect(res.status).toBe(404);
  });

  it("returns 400 when favorite is not boolean", async () => {
    const store = { get: jest.fn(), save: jest.fn() };
    const app = buildApp(store);
    const res = await request(app)
      .patch("/sessions/sess-1/favorite")
      .send({ favorite: "yes" });
    expect(res.status).toBe(400);
  });

  it("lists only favorited sessions", async () => {
    const sessions = [
      makeSession({ id: "s1", favorite: true }),
      makeSession({ id: "s2", favorite: false }),
      makeSession({ id: "s3", favorite: true }),
    ];
    const store = { list: jest.fn().mockResolvedValue(sessions) };
    const app = buildApp(store);
    const res = await request(app).get("/sessions/favorites");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((s: any) => s.id)).toEqual(["s1", "s3"]);
  });
});
