import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardStatsCards } from "./dashboard-stats-cards";
import type { DashboardStats } from "@/lib/dashboard-stats";

vi.mock("@/components/locale/locale-provider", () => ({ useLocale: () => ({ locale: "zh" }) }));
vi.mock("@/lib/i18n/locale-store", () => ({ t: (value: string) => value }));
beforeEach(() => vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
}));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const stats: DashboardStats = {
  pendingNew: 0, inProgressNew: 0, pendingReview: 0, inProgressReview: 0,
  plannedReviewRemaining: 0, dueTodayReview: 0, overdueReview: 0, upcomingReview: 0,
  completedTotal: 7, completedReview: 5, completedNew: 2, caughtUpOverdue: 3,
  studyMinutesToday: 12.5, dueTodayUnscheduled: 0, overdueUnscheduled: 0, totalUnscheduled: 0,
  progress: { total: 40, mastered: 0, learning: 0, needsWork: 0, notStarted: 40 },
};

const show = () => render(<DashboardStatsCards level="N1" stats={stats} estimatedMinutes={0} />);

describe("completed dashboard statistics", () => {
  it("keeps the requested reading order and values without permanent explanatory prose", () => {
    show();
    const card = screen.getByLabelText("今日完成");
    expect(within(card).getAllByRole("term").map(node => node.textContent)).toEqual([
      "完成总数", "完成复习", "完成新学", "今日实际用时", "其中补充逾期",
    ]);
    expect(within(card).getAllByRole("definition").map(node => node.textContent)).toEqual([
      "7", "5", "2", "12.5 分钟", "3",
    ]);
    expect(screen.queryByText("实际用时包含已完成、进行中及额外练习。")).not.toBeInTheDocument();
    expect(screen.queryByText("已包含在完成复习中")).not.toBeInTheDocument();
  });

  it("reveals the time explanation on keyboard focus and dismisses it with Escape", async () => {
    show();
    const label = screen.getByRole("button", { name: "今日实际用时" });
    fireEvent.focus(label);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("实际用时包含已完成、进行中及额外练习。");
    fireEvent.keyDown(label, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });

  it("lets touch users reveal and close the overdue explanation by clicking the label", async () => {
    show();
    const label = screen.getByRole("button", { name: "其中补充逾期" });
    fireEvent.pointerDown(label, { pointerType: "touch" });
    fireEvent.pointerUp(label, { pointerType: "touch" });
    fireEvent.click(label);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("已包含在完成复习中");
    fireEvent.pointerDown(label, { pointerType: "touch" });
    fireEvent.pointerUp(label, { pointerType: "touch" });
    fireEvent.click(label);
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });
});
