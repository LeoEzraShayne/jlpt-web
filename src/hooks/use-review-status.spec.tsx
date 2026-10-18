import { act, cleanup, render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { apiFetcher, ApiError } from "@/lib/api/client";
import { useReviewStatus } from "./use-review-status";
vi.mock('@/lib/api/client', async original => ({...await original<typeof import('@/lib/api/client')>(),apiFetcher:vi.fn()}));
function Status({ id = 'job' }: {id?:string}) { const state = useReviewStatus(id, 1_000);return <div><button onClick={()=>void state.mutate()}>read</button>{state.error ? 'recovering' : state.data?.status ?? 'loading'}</div>; }
function mount() { return render(<SWRConfig value={{provider:()=>new Map(),errorRetryCount:2}}><Status /></SWRConfig>); }
async function advance(ms:number) { await act(async()=>{await vi.advanceTimersByTimeAsync(ms)}); }
beforeEach(()=>{vi.useFakeTimers();vi.mocked(apiFetcher).mockReset()});
afterEach(()=>{cleanup();vi.useRealTimers()});
it('honors Retry-After across focus and recovers after more than two rate limits without resubmission',async()=>{
  vi.mocked(apiFetcher).mockRejectedValueOnce(new ApiError('limited',429,'HTTP_429',undefined,undefined,5_000))
    .mockRejectedValueOnce(new ApiError('limited',429,'HTTP_429',undefined,undefined,5_000))
    .mockRejectedValueOnce(new ApiError('limited',429,'HTTP_429',undefined,undefined,5_000))
    .mockResolvedValue({id:'job',status:'COMPLETED'});
  mount();await advance(1);expect(screen.getByText('recovering')).toBeInTheDocument();
  await act(async()=>window.dispatchEvent(new Event('focus')));await advance(4_000);expect(apiFetcher).toHaveBeenCalledTimes(1);
  await advance(1_100);expect(apiFetcher).toHaveBeenCalledTimes(2);
  await advance(5_100);expect(apiFetcher).toHaveBeenCalledTimes(3);
  await advance(5_100);expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  await advance(60_000);expect(apiFetcher).toHaveBeenCalledTimes(4);
});
it('continues recovery through repeated network failures and cancels timers on unmount',async()=>{
  vi.mocked(apiFetcher).mockRejectedValue(new ApiError('offline',0));
  const view=mount();await advance(1);
  for(let i=0;i<5;i++)await advance(30_000);
  expect(vi.mocked(apiFetcher).mock.calls.length).toBeGreaterThan(3);
  const calls=vi.mocked(apiFetcher).mock.calls.length;view.unmount();await advance(60_000);expect(apiFetcher).toHaveBeenCalledTimes(calls);
});
it.each([401,403,404])('does not keep automatically retrying permanent status %s',async status=>{
  vi.mocked(apiFetcher).mockRejectedValue(new ApiError('unavailable',status));mount();await advance(1);await advance(120_000);expect(apiFetcher).toHaveBeenCalledTimes(1);
});
it('uses a conservative sixty-second fallback when Retry-After is absent',async()=>{
  vi.mocked(apiFetcher).mockRejectedValueOnce(new ApiError('limited',429)).mockResolvedValue({id:'job',status:'COMPLETED'});
  mount();await advance(1);await advance(59_000);expect(apiFetcher).toHaveBeenCalledTimes(1);
  await advance(1_100);expect(screen.getByText('COMPLETED')).toBeInTheDocument();
});
it('makes no recovery requests while offline and resumes the existing job when online',async()=>{
  vi.mocked(apiFetcher).mockRejectedValueOnce(new ApiError('limited',429,'HTTP_429',undefined,undefined,1_000)).mockResolvedValue({id:'job',status:'COMPLETED'});
  mount();await advance(1);
  const online=vi.spyOn(navigator,'onLine','get').mockReturnValue(false);
  try {await advance(10_000);expect(apiFetcher).toHaveBeenCalledTimes(1);online.mockReturnValue(true);await advance(2_100);expect(screen.getByText('COMPLETED')).toBeInTheDocument();}
  finally {online.mockRestore();}
});
it('does not start a recovery loop for an already completed job',async()=>{
  vi.mocked(apiFetcher).mockResolvedValueOnce({id:'job',status:'COMPLETED'}).mockRejectedValue(new ApiError('offline',0));
  mount();await advance(1);
  await act(async()=>screen.getByRole('button',{name:'read'}).click());
  await advance(120_000);expect(apiFetcher).toHaveBeenCalledTimes(2);
});
