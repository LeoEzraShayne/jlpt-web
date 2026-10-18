import { test, expect, type Page } from "./adult-fixture";
import { mockVocabularyLearning } from "./vocabulary-learning-mock";
import { expectNoHorizontalOverflow } from "./layout";
import type { LearningVocabulary } from "../src/components/vocabulary-learning/types";

async function libraryFixture(page: Page) {
  const state = await mockVocabularyLearning(page);
  const template = state.words[0];
  const words: LearningVocabulary[] = [
    { ...template, id: "kana", word: "あっさり", reading: "あっさり", learning: null },
    { ...template, id: "unknown", word: "明白", reading: "あからさま", learning: { ...template.learning!, vocabularyId: "unknown", knowledge: "UNKNOWN" as const, practiceEnabled: false } },
    { ...template, id: "both", word: "コーヒー", reading: "こーひー", learning: { ...template.learning!, vocabularyId: "both", knowledge: "REMEMBERED" as const, practiceEnabled: true } },
    { ...template, id: "half", word: "ｺｰﾋｰ", reading: "こーひー", learning: null },
    { ...template, id: "mixed", word: "食べる", reading: "たべる", learning: null },
    { ...template, id: "sense", word: "あっさり", reading: "あっさり", senseKey: "other", chineseGloss: "清淡", learning: null },
  ];
  const requests: URL[] = [];
  const bookmarks = new Set(["unknown", "both"]);
  let failOnce = false;
  await page.route("**/api/v1/**", async route => {
    const req = route.request(), url = new URL(req.url()), path = url.pathname.replace("/api/v1", "");
    if (!["/vocabulary", "/vocabulary-learning", "/vocabulary/bookmarks", "/expressions", "/content-imports"].includes(path) && !/^\/vocabulary\/[^/]+\/(learning|bookmark)$/.test(path)) return route.fallback();
    const headers = { "access-control-allow-origin": req.headers().origin ?? "*", "access-control-allow-credentials": "true", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,PATCH,PUT,DELETE,OPTIONS" };
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
    const mutation = path.match(/^\/vocabulary\/([^/]+)\/(learning|bookmark)$/);
    if (mutation) {
      const word = words.find(item => item.id === mutation[1])!;
      if (mutation[2] === "bookmark") { if (req.method() === "DELETE") bookmarks.delete(word.id); else bookmarks.add(word.id); }
      else {
        const action = req.postDataJSON().action;
        word.learning = { ...template.learning!, ...word.learning, vocabularyId: word.id, knowledge: action === "UNKNOWN" ? "UNKNOWN" : action === "REMEMBERED" ? "REMEMBERED" : "KNOWN", practiceEnabled: action === "REMEMBERED" ? !!word.learning?.practiceEnabled : action === "PRACTICE", manualRevision: (word.learning?.manualRevision ?? 0) + 1 };
      }
      return route.fulfill({ headers, json: { data: word.learning ?? {}, meta: {} } });
    }
    requests.push(url);
    if (failOnce) { failOnce = false; return route.fulfill({ status: 503, headers, json: { error: { message: "服务暂不可用" } } }); }
    if (["/expressions", "/content-imports"].includes(path)) return route.fulfill({ headers, json: { data: [], meta: {} } });
    const list = url.searchParams.get("list"), query = url.searchParams.get("query");
    const filtered = words.filter(word => word.level === url.searchParams.get("level") && (!query || `${word.word}${word.reading}${word.chineseGloss}`.includes(query))
      && (path !== "/vocabulary/bookmarks" || bookmarks.has(word.id))
      && (!list || (list === "UNKNOWN" ? word.learning?.knowledge === "UNKNOWN" : list === "REMEMBERED" ? word.learning?.knowledge === "REMEMBERED" : !!word.learning?.practiceEnabled)));
    const offset = Number(url.searchParams.get("cursor") ?? 0), items = filtered.slice(offset, offset + 2);
    return route.fulfill({ headers, json: { data: path === "/vocabulary/bookmarks" ? items.map(vocabulary => ({ id: `b-${vocabulary.id}`, note: "", vocabulary })) : items, meta: { nextCursor: offset + 2 < filtered.length ? String(offset + 2) : null } } });
  });
  return { requests, failNext: () => { failOnce = true; } };
}

test("library layout, filters, cached page mutation, auxiliary panels and kana titles", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  const state = await libraryFixture(page);
  await page.goto("/library");
  await expect(page).toHaveURL(/\/library$/);
  await expect(page).toHaveTitle(/词汇与表达库/);
  const levels = page.getByRole("group", { name: "词汇参考级别" });
  const filters = page.getByRole("navigation", { name: "词汇筛选" });
  const cards = page.getByLabel("词汇卡片列表");
  await expect(levels.getByRole("button")).toHaveText(["N1", "N2", "N3", "N4"]);
  await expect(filters.getByRole("button")).toHaveText(["根本不会", "想熟练", "已记住", "词汇学习清单", "生词收藏", "更多"]);
  await page.screenshot({ path: `/tmp/jlpt-library-${info.project.name}-zh.png`, fullPage: true });
  const rows = await Promise.all([levels, page.getByLabel("搜索词汇"), filters].map(locator => locator.boundingBox()));
  expect(rows[0]!.y).toBeLessThan(rows[1]!.y); expect(rows[1]!.y).toBeLessThan(rows[2]!.y);
  await expect(cards.getByRole("heading")).toHaveText(["あっさり", "明白あからさま"]);
  await page.getByRole("button", { name: "加载更多", exact: true }).click();
  await expect(cards.getByRole("heading")).toHaveCount(4);
  await expect(cards.getByRole("heading").nth(2)).toHaveText("コーヒー");
  await expect(cards.getByRole("heading").nth(3)).toHaveText("ｺｰﾋｰ");
  await page.getByRole("button", { name: "加载更多", exact: true }).click();
  await expect(cards.getByRole("heading")).toHaveCount(6);
  await expect(cards.getByRole("heading").nth(4)).toHaveText("食べるたべる");
  await expect(cards.getByRole("heading", { name: "あっさり", exact: true })).toHaveCount(2);
  await filters.getByRole("button", { name: "根本不会", exact: true }).click();
  const learningCards = page.getByLabel("学习词汇卡片列表");
  await expect(learningCards.getByRole("heading")).toHaveText(["明白あからさま"]);
  await filters.getByRole("button", { name: "想熟练", exact: true }).click();
  await expect(learningCards.getByRole("heading")).toHaveText(["コーヒー"]);
  await filters.getByRole("button", { name: "已记住", exact: true }).click();
  await expect(learningCards.getByRole("heading")).toHaveText(["コーヒー"]);
  await learningCards.getByRole("button", { name: "根本不会", exact: true }).click();
  await expect(page.getByText("这个清单暂时没有词汇")).toBeVisible();
  await filters.getByRole("button", { name: "根本不会", exact: true }).click();
  await expect(learningCards.getByRole("heading")).toHaveText(["明白あからさま", "コーヒー"]);
  await filters.getByRole("button", { name: "根本不会", exact: true }).click();
  await expect(cards.getByRole("heading")).toHaveCount(2);
  await page.getByRole("button", { name: "加载更多", exact: true }).click();
  const changedCard = cards.locator('[data-slot="card"]').filter({ has: page.getByRole("heading", { name: "コーヒー", exact: true }) });
  await expect(changedCard.getByRole("button", { name: "根本不会", exact: true })).toHaveAttribute("aria-pressed", "true");
  await filters.getByRole("button", { name: "生词收藏", exact: true }).click();
  await expect(cards.getByRole("heading")).toHaveCount(2);
  await cards.getByRole("button", { name: "取消收藏", exact: true }).first().click();
  await expect(cards.getByRole("heading")).toHaveText(["コーヒー"]);
  await page.getByLabel("搜索词汇").fill("コーヒー");
  await expect.poll(() => state.requests.at(-1)?.searchParams.get("query")).toBe("コーヒー");
  await filters.getByRole("button", { name: "更多", exact: true }).click();
  await page.getByRole("button", { name: "我的表达", exact: true }).click();
  await expect(page.getByText("还没有收藏的表达")).toBeVisible();
  await expect(page.getByLabel("搜索词汇")).toHaveCount(0);
  await page.getByRole("button", { name: "返回词汇库" }).click();
  await expect(page.getByLabel("搜索词汇")).toHaveValue("コーヒー");
  await expect(filters.getByRole("button", { name: "生词收藏" })).toHaveAttribute("aria-pressed", "true");
  await filters.getByRole("button", { name: "更多", exact: true }).click();
  await page.getByRole("button", { name: "私人资料导入", exact: true }).click();
  await expect(page.getByLabel("导入 JSON 文件")).toBeVisible();
  await expect(page.getByLabel("资料 JSON")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "返回词汇库" }).click();
  await levels.getByRole("button", { name: "N2", exact: true }).click();
  await expect(page.getByLabel("搜索词汇")).toHaveValue("コーヒー");
  await expect(page.getByText("还没有收藏生词")).toBeVisible();
  expect(state.requests.at(-1)?.searchParams.get("cursor")).toBeNull();
  await expectNoHorizontalOverflow(page); expect(errors).toEqual([]);
});

test("English library labels, due list, retry and empty state stay usable", async ({ page }, info) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && !/Failed to load resource.*503/.test(message.text())) errors.push(message.text()); });
  await page.addInitScript(() => localStorage.setItem("jlpt-ui-locale", "en"));
  const state = await libraryFixture(page);
  await page.goto("/library");
  const filters = page.getByRole("navigation", { name: "Vocabulary filters" });
  await expect(filters.getByRole("button")).toHaveText(["Unknown", "Practice more", "Learned", "Vocabulary learning list", "Bookmarked words", "More"]);
  await filters.getByRole("button", { name: "Vocabulary learning list", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Due for review today" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "コーヒー", exact: true })).toBeVisible();
  await expect(page.getByLabel("Search learning vocabulary")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `/tmp/jlpt-library-${info.project.name}-en.png`, fullPage: true });
  state.failNext();
  await page.getByLabel("Search vocabulary").fill("no result");
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByText("No vocabulary in this list yet")).toBeVisible();
  await filters.getByRole("button", { name: "More", exact: true }).click();
  await expect(page.getByRole("button", { name: "Import personal material" })).toBeVisible();
  await expectNoHorizontalOverflow(page); expect(errors).toEqual([]);
});
