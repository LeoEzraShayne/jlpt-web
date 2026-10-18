import { afterEach, expect, it, vi } from "vitest";
import { apiRequest, parseRetryAfter } from "./client";
afterEach(() => vi.unstubAllGlobals());
it('reads both Retry-After formats and carries the delay with a 429 error', async () => {
  const now = Date.parse('2026-09-21T00:00:00Z');
  expect(parseRetryAfter('60', now)).toBe(60_000);
  expect(parseRetryAfter('Mon, 21 Sep 2026 00:00:20 GMT', now)).toBe(20_000);
  expect(parseRetryAfter(null, now)).toBeUndefined();
  expect(parseRetryAfter('invalid', now)).toBeUndefined();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({error:{code:'HTTP_429',message:'Too many requests'}}), {status:429, headers:{'Retry-After':'5'}})));
  await expect(apiRequest('/sentence-reviews/job')).rejects.toMatchObject({status:429,retryAfterMs:5_000});
});
