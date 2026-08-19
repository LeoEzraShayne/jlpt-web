import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { apiRequest, ApiError } from "./client";
import { server } from "../../../test/server";

const base = "http://localhost:4000/api/v1";

describe("apiRequest", () => {
  it("unwraps data and cursor metadata", async () => {
    server.use(http.get(`${base}/items`, () => HttpResponse.json({ data: [1, 2], meta: { nextCursor: "next" } })));
    await expect(apiRequest<number[]>("/items")).resolves.toEqual({ data: [1, 2], meta: { nextCursor: "next" } });
  });
  it("normalizes API errors and request id", async () => {
    server.use(http.get(`${base}/private`, () => HttpResponse.json({ error: { code: "AUTH_REQUIRED", message: "请登录", requestId: "req-1" } }, { status: 401 })));
    const error = await apiRequest("/private").catch((cause) => cause);
    expect(error).toBeInstanceOf(ApiError); expect(error).toMatchObject({ status: 401, code: "AUTH_REQUIRED", requestId: "req-1" });
  });
});
