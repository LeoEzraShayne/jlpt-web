import { expect, test, type Page } from "@playwright/test";

async function mockDashboard(page: Page, state: "ready" | "empty" | "locked" = "ready") {
  const started: unknown[] = [];
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const tasks = state === "empty" ? [] : [1, 2].map((index) => ({
    id: `t${index}`, grammarId: `g${index}`, type: "REVIEW", status: "PENDING",
    estimatedMinutes: 3, priorityGroup: "DUE_TODAY", overdueDays: 0, locked: state === "locked",
    grammar: { id: `g${index}`, level: "N1", title: `复习语法 ${index}`, chineseExplanation: "测试复习任务" },
  }));
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = { "access-control-allow-origin": request.headers().origin ?? "*",
      "access-control-allow-credentials": "true", "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS" };
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    let data: unknown = {};
    if (path.endsWith("/me")) data = { id: "u1", displayName: "测试用户", colorTheme: "sunshine", role: "USER" };
    if (path.endsWith("/study-plans")) data = { items: [{ id: "p1", level: "N1", dailyMinutes: 60, status: "ACTIVE" }], nextCursor: null };
    if (path.endsWith("/study-plans/current")) data = { id: "p1", level: "N1", dailyMinutes: 60, status: "ACTIVE" };
    if (path.endsWith("/dashboard/today")) data = {
      tasks, nextTaskId: tasks[1]?.id, estimatedMinutes: 6, requiredReviewRemaining: tasks.length, newLearningUnlocked: false,
      summary: { level: "N1", totalGrammar: 40, reviewCount: tasks.length, newCount: 0, completedCount: 0 },
      planning: { budgetMinutes: 60, plannedMinutes: 6, dueUnscheduledCount: 0 },
    };
    if (path.endsWith("/study-sessions") && request.method() === "POST") {
      started.push(request.postDataJSON());
      await gate;
      data = { session: { id: "s1" } };
    }
    if (path.endsWith("/study-sessions/s1")) data = {
      id: "s1", grammarId: "g2", mode: "REVIEW", status: "ACTIVE", attempts: [],
      grammar: { id: "g2", title: "复习语法 2", level: "N1", examples: [], progress: [] },
    };
    await route.fulfill({ status: 200, contentType: "application/json", headers, body: JSON.stringify({ data }) });
  });
  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "今日任务", exact: true })).toBeVisible();
  return { started, release };
}

test("Enter starts the recommended card exactly once, not the first task in the list", async ({ page }) => {
  const mock = await mockDashboard(page);
  await expect(page.getByRole("button", { name: "开始复习", exact: true }).first()).toBeVisible();
  for (const key of ["Shift+Enter", "Control+Enter", "Alt+Enter", "Meta+Enter"]) await page.keyboard.press(key);
  for (const extra of [{ isComposing: true }, { keyCode: 229 }, { repeat: true }]) {
    await page.locator("body").dispatchEvent("keydown", { key: "Enter", bubbles: true, ...extra });
  }
  expect(mock.started).toHaveLength(0);
  await page.keyboard.press("Enter");
  await expect.poll(() => mock.started.length).toBe(1);
  expect(mock.started[0]).toEqual({ taskId: "t2", grammarId: "g2", mode: "REVIEW" });
  await expect(page.getByRole("button", { name: "开始复习", exact: true }).first()).toBeDisabled();
  await page.keyboard.press("Enter");
  expect(mock.started).toHaveLength(1);
  mock.release();
  await expect(page).toHaveURL(/\/study\/s1$/);
  await expect(page.getByPlaceholder(/请使用/)).toBeVisible();
  // The homepage shortcut is gone after navigation.
  await page.keyboard.press("Enter");
  expect(mock.started).toHaveLength(1);
});

test("a focused task button keeps its own Enter action", async ({ page }) => {
  const mock = await mockDashboard(page);
  const grid = page.locator('[aria-label="先完成复习任务列表"]');
  await grid.getByRole("button", { name: "开始复习", exact: true }).first().focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => mock.started.length).toBe(1);
  expect(mock.started[0]).toEqual({ taskId: "t1", grammarId: "g1", mode: "REVIEW" });
  mock.release();
  await expect(page).toHaveURL(/\/study\/s1$/);
});

for (const state of ["empty", "locked"] as const) {
  test(`Enter does not start an ${state} recommendation`, async ({ page }) => {
    const mock = await mockDashboard(page, state);
    await page.keyboard.press("Enter");
    // Navigate using a focused link to flush the keyboard interaction without starting a task.
    await page.getByRole("link", { name: "语法库", exact: true }).first().focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/grammar$/);
    expect(mock.started).toHaveLength(0);
  });
}
