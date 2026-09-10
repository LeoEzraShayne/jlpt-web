import type { Dashboard } from "@/lib/api/types";

export interface DashboardStats {
  pendingNew: number;
  inProgressNew: number;
  pendingReview: number;
  inProgressReview: number;
  plannedReviewRemaining: number;
  dueTodayReview: number;
  overdueReview: number;
  upcomingReview: number;
  completedTotal: number;
  completedReview: number;
  completedNew: number;
  caughtUpOverdue: number;
  studyMinutesToday: number;
  dueTodayUnscheduled: number;
  overdueUnscheduled: number;
  totalUnscheduled: number;
  progress: {
    total: number;
    mastered: number;
    learning: number;
    needsWork: number;
    notStarted: number;
  };
}

const activeTasks = (dashboard: Dashboard) =>
  dashboard.tasks.filter(
    (task) => task.status !== "COMPLETED" && task.status !== "SKIPPED",
  );

export function getDashboardStats(dashboard: Dashboard): DashboardStats {
  const { summary, planning } = dashboard;
  const active = activeTasks(dashboard);
  const completed = dashboard.tasks.filter((task) => task.status === "COMPLETED");
  const overdueReview = summary.overdueReviewCount;
  const dueTodayReview =
    summary.dueTodayReviewCount ??
    Math.max(0, summary.reviewCount - overdueReview);
  const overdueUnscheduled = planning.overdueUnscheduledCount ?? 0;
  const dueTodayUnscheduled = planning.dueTodayUnscheduledCount ?? 0;
  const splitUnscheduled = overdueUnscheduled + dueTodayUnscheduled;
  const totalUnscheduled =
    planning.overdueUnscheduledCount === undefined &&
    planning.dueTodayUnscheduledCount === undefined
      ? planning.dueUnscheduledCount
      : splitUnscheduled;
  const total = summary.totalGrammar;
  const mastered = summary.masteredGrammar;
  const notStarted =
    summary.notStartedGrammar ?? Math.max(0, total - summary.learnedGrammar);
  const needsWork = summary.needsWorkGrammar ?? 0;
  const learning =
    summary.learningGrammar ??
    Math.max(0, total - mastered - needsWork - notStarted);

  return {
    pendingNew:
      summary.pendingNewCount ??
      active.filter((task) => task.type === "LEARN" && task.status === "PENDING")
        .length,
    inProgressNew:
      summary.inProgressNewCount ??
      active.filter(
        (task) => task.type === "LEARN" && task.status === "IN_PROGRESS",
      ).length,
    pendingReview:
      summary.pendingReviewCount ??
      active.filter(
        (task) => task.type === "REVIEW" && task.status === "PENDING",
      ).length,
    inProgressReview:
      summary.inProgressReviewCount ??
      active.filter(
        (task) => task.type === "REVIEW" && task.status === "IN_PROGRESS",
      ).length,
    plannedReviewRemaining:
      summary.plannedReviewRemainingCount ?? dashboard.requiredReviewRemaining,
    dueTodayReview,
    overdueReview,
    upcomingReview: summary.upcomingReviewCount ?? 0,
    completedTotal: summary.completedTodayCount ?? summary.completedCount,
    completedReview:
      summary.completedTodayReviewCount ??
      completed.filter((task) => task.type === "REVIEW").length,
    completedNew:
      summary.completedTodayNewCount ??
      completed.filter((task) => task.type === "LEARN").length,
    caughtUpOverdue: summary.caughtUpOverdueTodayCount ?? 0,
    studyMinutesToday: summary.studyMinutesToday ?? 0,
    dueTodayUnscheduled,
    overdueUnscheduled,
    totalUnscheduled,
    progress: { total, mastered, learning, needsWork, notStarted },
  };
}
