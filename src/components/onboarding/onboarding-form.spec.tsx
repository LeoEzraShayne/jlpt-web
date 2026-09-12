import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingForm } from "./onboarding-form";
import type { StudyPlan } from "@/lib/api/types";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  mutate: vi.fn(),
  replace: vi.fn(),
  planState: {} as Record<string, unknown>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/hooks/use-api", () => ({ useMe: () => ({ data: null, mutate: vi.fn() }),
  usePlans: () => mocks.planState,
}));

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  apiRequest: mocks.apiRequest,
}));

const plan: StudyPlan = {
  id: "plan-1",
  level: "N1",
  startDate: "2026-08-12T12:00:00.000Z",
  targetDate: "2026-08-31T12:00:00.000Z",
  dailyMinutes: 20,
  dailyNewLimit: 2,
  status: "ACTIVE",
  totalGrammar: 40,
  learnedGrammar: 0,
  remainingGrammar: 40,
  recommendedDailyNew: 2,
};

describe("OnboardingForm", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.planState = {
      data: { items: [], nextCursor: null },
      error: undefined,
      isLoading: false,
      mutate: mocks.mutate,
    };
    mocks.apiRequest.mockResolvedValue({ data: plan });
    mocks.mutate.mockResolvedValue(plan);
  });

  it("stores the created plan before navigating to today", async () => {
    render(<OnboardingForm />);
    fireEvent.click(
      screen.getByRole("button", { name: "生成我的学习计划" }),
    );

    await waitFor(() =>
      expect(mocks.mutate).toHaveBeenCalledWith({ items: [plan], nextCursor: null }, {
        revalidate: false,
      }),
    );
    expect(mocks.apiRequest.mock.calls[0]).toEqual(["/me/preferences", expect.objectContaining({ method: "PUT", body: expect.stringContaining('"targetLevel":"N1"') })]);
    expect(mocks.replace).toHaveBeenCalledWith("/today");
  });

  it("sets the selected level as primary before creating the first plan", async () => {
    render(<OnboardingForm />);
    fireEvent.click(screen.getByRole("button", { name: /^N2/ }));
    fireEvent.click(screen.getByRole("button", { name: "生成我的学习计划" }));
    await waitFor(() => expect(mocks.apiRequest).toHaveBeenCalledTimes(2));
    expect(mocks.apiRequest.mock.calls[0][0]).toBe("/me/preferences");
    expect(JSON.parse(mocks.apiRequest.mock.calls[0][1].body).targetLevel).toBe("N2");
    expect(mocks.apiRequest.mock.calls[1][0]).toBe("/study-plans");
    expect(JSON.parse(mocks.apiRequest.mock.calls[1][1].body).level).toBe("N2");
  });

  it("redirects an existing plan instead of showing setup again", async () => {
    mocks.planState = {
      data: { items: [{ ...plan, status: "PAUSED" }], nextCursor: null },
      error: undefined,
      isLoading: false,
      mutate: mocks.mutate,
    };

    render(<OnboardingForm />);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/today"));
    expect(
      screen.queryByRole("button", { name: "生成我的学习计划" }),
    ).not.toBeInTheDocument();
  });
});
