import { describe, expect, it } from "vitest";
import type { Dashboard } from "@/lib/api/types";
import { getDashboardStats } from "@/lib/dashboard-stats";

const dashboard: Dashboard = {
  summary: {
    newCount: 6,
    reviewCount: 20,
    completedCount: 5,
    pendingNewCount: 5,
    inProgressNewCount: 1,
    pendingReviewCount: 3,
    inProgressReviewCount: 2,
    plannedReviewRemainingCount: 0,
    dueTodayReviewCount: 0,
    upcomingReviewCount: 30,
    overdueReviewCount: 0,
    completedTodayCount: 25,
    completedTodayReviewCount: 20,
    completedTodayNewCount: 5,
    caughtUpOverdueTodayCount: 16,
    studyMinutesToday: 52,
    level: "N1",
    totalGrammar: 40,
    masteryPercent: 0,
    masteredGrammar: 0,
    learningGrammar: 20,
    needsWorkGrammar: 10,
    notStartedGrammar: 10,
    unmasteredGrammar: 40,
    learnedGrammar: 30,
    trackedGrammar: 30,
  },
  estimatedMinutes: 40,
  requiredReviewRemaining: 0,
  newLearningUnlocked: true,
  planning: {
    budgetMinutes: 60,
    plannedMinutes: 40,
    dueUnscheduledCount: 3,
    overdueUnscheduledCount: 2,
    dueTodayUnscheduledCount: 1,
    planAtRisk: false,
    algorithmVersion: "adaptive-v1",
  },
  tasks: [],
};

describe("getDashboardStats", () => {
  it("keeps each new dashboard metric independent", () => {
    const stats = getDashboardStats(dashboard);

    expect(stats).toMatchObject({
      pendingNew: 5,
      inProgressNew: 1,
      pendingReview: 3,
      inProgressReview: 2,
      plannedReviewRemaining: 0,
      completedTotal: 25,
      completedReview: 20,
      completedNew: 5,
      caughtUpOverdue: 16,
      upcomingReview: 30,
      studyMinutesToday: 52,
      overdueUnscheduled: 2,
      dueTodayUnscheduled: 1,
      totalUnscheduled: 3,
      progress: {
        total: 40,
        mastered: 0,
        learning: 20,
        needsWork: 10,
        notStarted: 10,
      },
    });
  });

  it("derives safe values while the legacy API is still active", () => {
    const legacy = structuredClone(dashboard);
    delete legacy.summary.pendingNewCount;
    delete legacy.summary.inProgressNewCount;
    delete legacy.summary.pendingReviewCount;
    delete legacy.summary.inProgressReviewCount;
    delete legacy.summary.completedTodayCount;
    delete legacy.summary.completedTodayReviewCount;
    delete legacy.summary.completedTodayNewCount;
    delete legacy.summary.learningGrammar;
    delete legacy.summary.needsWorkGrammar;
    delete legacy.summary.notStartedGrammar;
    delete legacy.summary.upcomingReviewCount;
    delete legacy.summary.studyMinutesToday;
    delete legacy.planning.overdueUnscheduledCount;
    delete legacy.planning.dueTodayUnscheduledCount;
    legacy.summary.completedCount = 4;
    legacy.tasks = [
      { type: "LEARN", status: "PENDING" },
      { type: "LEARN", status: "IN_PROGRESS" },
      { type: "REVIEW", status: "COMPLETED" },
      { type: "REVIEW", status: "PENDING" },
      { type: "REVIEW", status: "IN_PROGRESS" },
    ] as Dashboard["tasks"];

    expect(getDashboardStats(legacy)).toMatchObject({
      pendingNew: 1,
      inProgressNew: 1,
      pendingReview: 1,
      inProgressReview: 1,
      completedTotal: 4,
      completedReview: 1,
      completedNew: 0,
      upcomingReview: 0,
      studyMinutesToday: 0,
      totalUnscheduled: 3,
      progress: { mastered: 0, learning: 30, needsWork: 0, notStarted: 10 },
    });
  });
});
