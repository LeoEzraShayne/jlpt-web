import { expect, test, type Page } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./layout";
const initialUser = {
  id: "u1",
  email: "test@example.com",
  displayName: "测试用户",
  role: "USER",
  timezone: "Asia/Tokyo",
  targetLevel: "N1",
  colorTheme: "sunshine",
  dailyMinutes: 30,
  primaryShare: 80,
};
const initialPlan = {
  id: "p1",
  level: "N1",
  mode: "SYSTEM",
  startDate: "2026-09-01T12:00:00Z",
  targetDate: "2026-12-06T12:00:00Z",
  dailyMinutes: 30,
  dailyNewLimit: 2,
  status: "ACTIVE",
  totalGrammar: 40,
  learnedGrammar: 5,
  remainingGrammar: 35,
  recommendedDailyNew: 2,
};
const word = {
  id: "v1",
  word: "予定",
  reading: "よてい",
  senseKey: "schedule",
  partOfSpeech: ["名词"],
  glosses: [{ language: "eng", text: "schedule" }],
  chineseGloss: "计划",
  chineseGlossSource: "个人核对",
  level: "N4",
  levelSource: "参考词表",
  sourceName: "JMdict",
  sourceUrl: "https://www.edrdg.org/",
  sourceVersion: "2026-09",
  license: "CC BY-SA 4.0",
  validationStatus: "VALIDATED",
  ownerId: null,
};
async function mockApi(page: Page, pausedOnly = false) {
  let user = { ...initialUser };
  const plans = pausedOnly
    ? [
        {
          ...initialPlan,
          id: "p2",
          level: "N2",
          mode: "GAP_FILL",
          status: "PAUSED",
        },
      ]
    : [{ ...initialPlan }];
  const writes: Array<{ path: string; body: Record<string, unknown> }> = [];
  let bookmarked = false;
  let imported = false;
  let validated = false;
  let committed = false;
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (e) => errors.push(e.message));
  const batch = {
    id: "batch1",
    fileName: "私人词表.json",
    sourceName: "我的资料",
    sourceVersion: "2026-09",
    status: "PENDING",
    summary: {},
    createdAt: "2026-09-10",
  };
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = req.method();
    const headers = {
      "access-control-allow-origin": req.headers().origin ?? "*",
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    };
    if (method === "OPTIONS") return route.fulfill({ status: 204, headers });
    const body = req.postData()
      ? (req.postDataJSON() as Record<string, unknown>)
      : {};
    if (method !== "GET") writes.push({ path, body });
    let data: unknown;
    let status = 200;
    if (path === "/me") data = user;
    else if (path === "/me/preferences") {
      user = { ...user, ...body };
      data = user;
    } else if (path === "/study-plans" && method === "GET")
      data = { items: plans, nextCursor: null };
    else if (path === "/study-plans" && method === "POST") {
      const existing = plans.find((p) => p.level === body.level);
      data = existing ?? {
        ...initialPlan,
        ...body,
        id: `p${plans.length + 1}`,
      };
      if (!existing) plans.push(data as typeof initialPlan);
    } else if (/^\/study-plans\/p\d+$/.test(path) && method === "PATCH") {
      const plan = plans.find((p) => path.endsWith(p.id))!;
      Object.assign(plan, body);
      data = plan;
    } else if (path === "/dashboard/today")
      data = {
        summary: {
          level: "N1",
          totalGrammar: 40,
          newCount: 1,
          reviewCount: 0,
          completedCount: 2,
          masteredGrammar: 2,
          learnedGrammar: 5,
          trackedGrammar: 5,
          overdueReviewCount: 12,
        },
        estimatedMinutes: 8,
        requiredReviewRemaining: 0,
        newLearningUnlocked: true,
        nextTaskId: "t1",
        planning: {
          budgetMinutes: 30,
          plannedMinutes: 8,
          dueUnscheduledCount: 12,
          overdueUnscheduledCount: 12,
        },
        allocation: {
          primaryMinutes: 24,
          foundationMinutes: 6,
          spentMinutes: 10,
          reservedMinutes: 4,
          remainingMinutes: 16,
          overrunMinutes: 0,
          primaryPlannedMinutes: 8,
          foundationPlannedMinutes: 0,
        },
        levels: [
          {
            planId: "p1",
            level: "N1",
            isPrimary: true,
            newCount: 1,
            reviewCount: 0,
            completedCount: 2,
            estimatedMinutes: 8,
          },
        ],
        backlog: { count: 12, overdueCount: 12 },
        tasks: [
          {
            id: "t1",
            grammarId: "g1",
            type: "LEARN",
            status: "PENDING",
            estimatedMinutes: 8,
            locked: false,
            priorityGroup: "NEW",
            grammar: {
              id: "g1",
              level: "N1",
              title: "～を踏まえて",
              chineseExplanation: "根据",
              examples: [],
            },
          },
        ],
      };
    else if (path === "/vocabulary") data = [word];
    else if (path === "/vocabulary/bookmarks")
      data = bookmarked
        ? [{ id: "b1", vocabulary: word, note: "工作中使用" }]
        : [];
    else if (path === "/vocabulary/v1/bookmark") {
      bookmarked = method !== "DELETE";
      data = { id: "b1" };
    } else if (path === "/expressions") data = [];
    else if (path === "/content-imports" && method === "GET")
      data = imported
        ? [{ ...batch, status: committed ? "COMMITTED" : "PENDING" }]
        : [];
    else if (path === "/content-imports/preview") {
      imported = true;
      data = { ...batch, inserted: 1, duplicates: 0 };
    } else if (path === "/content-imports/batch1")
      data = {
        ...batch,
        candidates: [
          {
            id: "candidate1",
            kind: "VOCABULARY",
            word: "予定",
            reading: "よてい",
            senseKey: "schedule",
            payload: {
              gloss: "计划；预定",
              level: "N4",
              levelSource: "个人资料参考分级",
              location: "第1页",
            },
            validationStatus: validated ? "VALIDATED" : "PENDING",
            validationNotes: "",
          },
        ],
        nextCursor: null,
      };
    else if (path === "/content-candidates/candidate1/validation") {
      validated = body.status === "VALIDATED";
      data = {};
    } else if (path === "/content-imports/batch1/commit") {
      committed = true;
      data = {};
    } else {
      status = 404;
      data = {};
    }
    await route.fulfill({
      status,
      headers,
      contentType: "application/json",
      body: JSON.stringify({ data, meta: { nextCursor: null } }),
    });
  });
  return { plans, writes, errors, getUser: () => user };
}

test("paused foundation plan without primary plan does not restart onboarding", async ({
  page,
}) => {
  const api = await mockApi(page, true);
  await page.goto("/profile");
  const n2 = page.getByLabel("N2 学习计划", { exact: true });
  await expect(n2.getByText("已暂停", { exact: true })).toBeVisible();
  await n2.getByRole("button", { name: "恢复计划" }).click();
  await expect(n2.getByText("进行中", { exact: true })).toBeVisible();
  expect(api.writes[0]).toEqual({
    path: "/study-plans/p2",
    body: { status: "ACTIVE" },
  });
  expect(api.getUser().targetLevel).toBe("N1");
  await expectNoHorizontalOverflow(page);
  expect(api.errors).toEqual([]);
});
test("create secondary plan preserves primary and edit primary independently", async ({
  page,
}) => {
  const api = await mockApi(page);
  await page.goto("/plans");
  const n2 = page.getByLabel("N2 学习计划", { exact: true });
  await n2.getByRole("button", { name: "建立 N2 计划" }).click();
  await expect(page.getByLabel("N2 学习方式")).toHaveValue("GAP_FILL");
  await n2.getByRole("button", { name: "创建 N2 计划" }).click();
  await expect(n2.getByText("进行中", { exact: true })).toBeVisible();
  expect(api.plans).toHaveLength(2);
  expect(api.writes[0].body.mode).toBe("GAP_FILL");
  expect(api.getUser().targetLevel).toBe("N1");
  await page.getByLabel("主目标", { exact: true }).selectOption("N2");
  await expect(page.getByLabel("主目标时间份额")).toHaveCount(0);
  await page.getByRole("button", { name: "保存每日安排" }).click();
  await expect.poll(() => api.getUser().targetLevel).toBe("N2");
  expect(api.getUser().primaryShare).toBe(80);
  expect(api.getUser().targetLevel).toBe("N2");
  await expectNoHorizontalOverflow(page);
  expect(api.errors).toEqual([]);
});
test("today shows retained spend and permits primary new work despite foundation backlog", async ({
  page,
}, testInfo) => {
  const api = await mockApi(page);
  await page.goto("/today");
  await expect(page.getByLabel("今日时间分配")).toHaveCount(0);
  await expect(page.getByLabel("今日完成")).toContainText("今日实际用时10 分钟");
  await expect(page.getByText(/预算|可再安排时间|练习预留/)).toHaveCount(0);
  const details = page.locator("details").filter({ hasText: "各级别今日安排" });
  await expect(details).not.toHaveAttribute("open", "");
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  await expect(details).toContainText("主目标");
  await details.locator("summary").click();
  await expect(
    page.getByRole("button", { name: "开始学习", exact: true }).first(),
  ).toBeEnabled();
  await expect(page.getByText(/还有 12 项逾期/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("今日完成")).toContainText("今日实际用时10 分钟");
  await expectNoHorizontalOverflow(page);
  expect(api.errors).toEqual([]);
  await page.screenshot({
    path: `/tmp/jlpt-v2-today-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
test("vocabulary provenance and personal bookmark notes stay usable on mobile", async ({
  page,
}) => {
  const api = await mockApi(page);
  await page.goto("/library");
  await expect(page.getByText(/词典：JMdict/)).toBeVisible();
  await page.getByLabel("予定 备注").fill("工作中使用");
  await page.getByRole("button", { name: "收藏生词", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已保存生词收藏");
  await page.getByLabel("内容类型").selectOption("bookmarks");
  await expect(page.getByLabel("予定 备注")).toHaveValue("工作中使用");
  await page.getByRole("button", { name: "取消收藏", exact: true }).click();
  await expect(page.getByText("还没有收藏生词")).toBeVisible();
  expect(api.writes.some((w) => w.body.note === "工作中使用")).toBe(true);
  await expectNoHorizontalOverflow(page);
  expect(api.errors).toEqual([]);
});
test("private imports require source confirmation before validation and explicit commit", async ({
  page,
}) => {
  const api = await mockApi(page);
  await page.goto("/library");
  await page.getByLabel("内容类型").selectOption("imports");
  await page.getByLabel("资料 JSON").fill("{broken");
  await page.getByRole("button", { name: "预览并校验格式" }).click();
  await expect(page.getByRole("status")).toContainText("JSON 格式有误");
  expect(api.writes).toHaveLength(0);
  await page.getByRole("button", { name: "填入格式示例" }).click();
  await page.getByRole("button", { name: "预览并校验格式" }).click();
  const validation = page.getByRole("button", { name: "确认正确" });
  await expect(validation).toBeDisabled();
  await page.getByLabel("予定 核对说明").fill("已核对原资料第1页");
  await expect(validation).toBeDisabled();
  await page.getByRole("checkbox").check();
  await validation.click();
  await expect(page.getByText("词汇 · 已核对")).toBeVisible();
  await page.getByRole("button", { name: "提交已校验内容" }).click();
  await expect(page.getByText(/已提交通过校验的内容/)).toBeVisible();
  expect(
    api.writes.find((w) => w.path.includes("validation"))?.body
      .checkedAgainstSource,
  ).toBe(true);
  await expectNoHorizontalOverflow(page);
  expect(api.errors).toEqual([]);
});
