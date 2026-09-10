import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./layout";

test("all tasks stay in the grid, completed tasks disappear, and the final task starts correctly", async ({ page }) => {
  const tasks = Array.from({ length: 19 }, (_, index) => ({
    id: `t${index}`, grammarId: `g${index}`, type: "REVIEW", status: "PENDING",
    estimatedMinutes: 4, priorityGroup: "DUE_TODAY", overdueDays: 0, locked: false,
    grammar: { id: `g${index}`, level: "N1", title: `～いかんによらず・～いかんにかかわらず ${index + 1}`,
      chineseExplanation: "无论……如何；不受……影响。用长句检查窄屏上的任务标题、说明和操作按钮。" },
  }));
  let startedTask: unknown;
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = { "access-control-allow-origin": route.request().headers().origin ?? "*",
      "access-control-allow-credentials": "true", "access-control-allow-headers": "content-type" };
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    let data: unknown = {};
    if (path.endsWith("/me")) data = { id: "u1", displayName: "测试用户", colorTheme: "sunshine", role: "USER" };
    if (path.endsWith("/study-plans/current")) data = { id: "p1", level: "N1", dailyMinutes: 60, status: "ACTIVE" };
    if (path.endsWith("/dashboard/today")) data = {
      tasks, nextTaskId: tasks.find((task) => task.status !== "COMPLETED")?.id, estimatedMinutes: 60, requiredReviewRemaining: 19, newLearningUnlocked: false,
      summary: { level: "N1", totalGrammar: 40, reviewCount: 21, newCount: 0, completedCount: 0,
        masteredGrammar: 0, learningGrammar: 24, needsWorkGrammar: 11, notStartedGrammar: 5, upcomingReviewCount: 14 },
      planning: { budgetMinutes: 60, plannedMinutes: 60, dueUnscheduledCount: 2, dueTodayUnscheduledCount: 2 },
    };
    if (path.endsWith("/study-sessions") && route.request().method() === "POST") {
      startedTask = route.request().postDataJSON();
      data = { session: { id: "s-last" } };
    }
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: JSON.stringify({ data }) });
  });
  await page.goto("/today");
  const grid = page.locator('[aria-label="先完成复习任务列表"]');
  await expect(grid.getByRole("heading")).toHaveCount(19);
  expect(await grid.getByRole("heading").allTextContents()).toEqual(tasks.map((task) => task.grammar.title));
  await expect(page.getByRole("button", { name: "下一页" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  tasks[0].status = "COMPLETED";
  await page.reload();
  await expect(grid.getByRole("heading")).toHaveCount(18);
  await expect(page.getByRole("heading", { name: tasks[0].grammar.title, exact: true })).toHaveCount(0);
  const overview = page.locator('[aria-label="今日学习概览"]');
  expect((await overview.boundingBox())!.y).toBeLessThan((await grid.boundingBox())!.y);
  await expectNoHorizontalOverflow(page);
  await grid.getByRole("button", { name: "开始复习" }).last().click();
  await expect(page).toHaveURL(/\/study\/s-last/);
  expect(startedTask).toMatchObject({ taskId: "t18", grammarId: "g18", mode: "REVIEW" });
});
