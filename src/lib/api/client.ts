const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (
  process.env.NODE_ENV === "production"
    ? "https://api.jlpt.meritledger.org/api/v1"
    : "http://localhost:4000/api/v1"
);

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "UNKNOWN_ERROR",
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) { super(message); }
}

export type ApiMeta = {
  nextCursor?: string | null;
  counts?: { overdue: number; dueToday: number; upcoming: number };
  scope?: "active" | "all";
  upcomingDays?: number;
  algorithmVersion?: string;
  isEstimate?: true;
  assumption?: "REMEMBERED";
  projectedCompletionDate?: string | null;
  targetDate?: string;
  remainingNewAfterHorizon?: number;
  planAtRisk?: boolean;
};

type Envelope<T> = { data: T; meta?: ApiMeta };

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<Envelope<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: { "content-type": "application/json", ...init?.headers },
      signal: init?.signal ?? AbortSignal.timeout(12_000),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new ApiError(
      timedOut ? "请求超时，请检查网络后重试" : "无法连接学习服务，请稍后重试",
      0,
      timedOut ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
    );
  }
  const payload = await response.json().catch(() => ({})) as {
    data?: T;
    meta?: Envelope<T>["meta"];
    error?: { code?: string; message?: string; details?: unknown; requestId?: string };
  };
  if (!response.ok) {
    throw new ApiError(
      payload.error?.message ?? "请求失败，请稍后重试",
      response.status,
      payload.error?.code,
      payload.error?.details,
      payload.error?.requestId,
    );
  }
  return { data: payload.data as T, meta: payload.meta };
}

export const apiFetcher = async <T>(path: string) => (await apiRequest<T>(path)).data;
export const authUrl = `${API_URL}/auth/google`;
