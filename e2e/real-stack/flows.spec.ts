import { test, expect, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
test.skip(!process.env.REAL_API_DIR, 'Run through scripts/real-stack/run.mjs');
const api = `http://127.0.0.1:${process.env.REAL_API_PORT ?? 4617}/api/v1`;
const fixture = (action: string, value = '') => JSON.parse(execFileSync(process.execPath,
  ['scripts/real-stack/database.mjs', action, value], { encoding: 'utf8' }));
async function apiData(page: Page, path: string, body?: unknown) {
  const response = body === undefined ? await page.request.get(api + path)
    : await page.request.post(api + path, { data: body, headers: { origin: new URL(page.url()).origin } });
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
  return (await response.json()).data;
}
async function login(page: Page) {
  const account = fixture('account');
  await page.context().addCookies([{ name: 'jlpt_session', value: account.token, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' }]);
  return account.id as string;
}
function watch(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  return errors;
}
async function healthy(page: Page, errors: string[], filename: string) {
  expect(new URL(page.url()).hostname).toBe('127.0.0.1');
  await expect(page).toHaveTitle(/文法トレーニング/);
  await expect.poll(async () => (await page.locator('body').innerText()).length).toBeGreaterThan(80);
  await expect(page.locator('nextjs-portal')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  expect(errors).toEqual([]);
  await page.screenshot({ path: resolve(process.env.REAL_QA_DIR!, filename), fullPage: true });
}

test('real plans preserve primary/shared budget, pause/resume, and generate today tasks', async ({ page }, info) => {
  const errors = watch(page); const userId = await login(page);
  await page.goto('/plans');
  const n2 = page.getByLabel('N2 学习计划', { exact: true });
  await n2.getByRole('button', { name: '建立 N2 计划' }).click();
  await expect(page.getByLabel('N2 学习方式')).toHaveValue('GAP_FILL');
  await n2.getByRole('button', { name: '创建 N2 计划' }).click();
  await expect(n2.getByText('进行中', { exact: true })).toBeVisible();
  let state = fixture('snapshot', userId);
  expect(state.user.targetLevel).toBe('N1'); expect(state.user.dailyMinutes).toBe(30);
  expect(state.plans).toHaveLength(2);
  await n2.getByRole('button', { name: '暂停计划' }).click();
  await expect(n2.getByText('已暂停', { exact: true })).toBeVisible();
  await n2.getByRole('button', { name: '恢复计划' }).click();
  await expect(n2.getByText('进行中', { exact: true })).toBeVisible();
  await page.goto('/today');
  await expect(page.getByLabel('剩余时间预算')).toBeVisible();
  const first = await apiData(page, '/dashboard/today');
  expect(first.allocation.primaryMinutes).toBe(24); expect(first.allocation.foundationMinutes).toBe(6);
  expect(first.tasks.length).toBeGreaterThan(0);
  const taskIds = first.tasks.map((t: { id: string }) => t.id).sort();
  await page.reload();
  expect((await apiData(page, '/dashboard/today')).tasks.map((t: { id: string }) => t.id).sort()).toEqual(taskIds);
  await healthy(page, errors, `real-today-${info.project.name}.png`);
  await page.goto('/plans');
  for (const level of ['N1', 'N2']) {
    const plan = page.getByLabel(`${level} 学习计划`, { exact: true });
    await plan.getByRole('button', { name: '暂停计划' }).click();
    await expect(plan.getByText('已暂停', { exact: true })).toBeVisible();
  }
  await page.goto('/today'); await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByLabel('剩余时间预算')).toBeVisible();
  expect((await apiData(page, '/study-plans')).items).toHaveLength(2);
  state = fixture('snapshot', userId);
  expect(state.plans.every((p: { status: string }) => p.status === 'PAUSED')).toBeTruthy();
  await healthy(page, errors, `real-all-paused-${info.project.name}.png`);
});

test('real job polling, four-part feedback, expression save, and hidden review evidence', async ({ page }, info) => {
  const errors = watch(page); const userId = await login(page);
  await page.goto('/today');
  await page.getByRole('button', { name: '开始学习', exact: true }).first().click();
  await expect(page).toHaveURL(/\/study\//);
  const sessionId = page.url().split('/').at(-1)!;
  const session = await apiData(page, `/study-sessions/${sessionId}`);
  expect(session.scenarioId).toBeTruthy(); expect(session.trainingContext.scenario.taskId).toBeTruthy();
  await page.getByLabel('日语句子').fill('結果を踏まえて決めます。');
  const submitted = page.waitForResponse(response => response.url() === api + '/sentence-reviews' && response.request().method() === 'POST');
  await page.getByRole('button', { name: '提交给 AI 批改' }).click();
  const job = (await (await submitted).json()).data;
  fixture('result', job.reviewId);
  for (const heading of ['内容回应', '拓展示例', '后续练习'])
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  await expect(page.getByText('目标语法使用正确。', { exact: true })).toBeVisible();
  await page.getByLabel('收藏表达来源').selectOption('ALTERNATIVE');
  await page.getByLabel('收藏表达备注').fill('真实接口保存');
  await page.getByRole('button', { name: '收藏表达', exact: true }).click();
  await expect(page.getByText('已收藏到个人常用表达库')).toBeVisible();
  let state = fixture('snapshot', userId);
  expect(state.expressions).toHaveLength(1); expect(state.expressions[0].note).toBe('真实接口保存');
  await healthy(page, errors, `real-feedback-${info.project.name}.png`);
  await page.getByRole('button', { name: '记住了', exact: true }).click();
  await expect.poll(() => fixture('snapshot', userId).sessions[0].status).toBe('COMPLETED');
  fixture('due', userId);
  const { session: review } = await apiData(page, '/study-sessions', { grammarId: 'browser-N1', mode: 'REVIEW' });
  await page.goto(`/study/${review.id}`);
  await expect(page.getByRole('button', { name: '查看参考表达（使用提示）' })).toBeVisible();
  const hidden = await apiData(page, `/study-sessions/${review.id}`);
  expect(JSON.stringify(hidden)).not.toContain('根据结果调整计划。');
  expect(hidden.trainingContext.expressions).toHaveLength(1);
  expect(fixture('snapshot', userId).sessions.at(-1).hintRevealCount).toBe(0);
  await page.getByRole('button', { name: '查看参考表达（使用提示）' }).click();
  await page.getByText('参考表达与短句素材', { exact: true }).click();
  await expect(page.getByText('根据结果调整计划。', { exact: true })).toBeVisible();
  expect(fixture('snapshot', userId).sessions.at(-1).hintRevealCount).toBe(1);
  await healthy(page, errors, `real-reveal-${info.project.name}.png`);
  await page.reload();
  await expect(page.getByText('根据结果调整计划。', { exact: true })).toHaveCount(0);
  await apiData(page, `/study-sessions/${review.id}/complete`, { recallRating: 'REMEMBERED' });
  state = fixture('snapshot', userId);
  const event = state.events.at(-1);
  expect(event.hintRevealCount).toBe(1); expect(event.firstScore).toBeNull();
  expect(event.crossScenarioValid).toBe(false);
});

test('real vocabulary bookmarks and private candidate preview/validation/commit', async ({ page }, info) => {
  const errors = watch(page); const userId = await login(page);
  await page.goto('/library');
  await expect(page.getByText(/词典：JMdict fixture/)).toBeVisible();
  await page.getByLabel('予定 备注').fill('真实收藏备注');
  await page.getByRole('button', { name: '收藏生词', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('已保存生词收藏');
  await page.getByLabel('内容类型').selectOption('bookmarks');
  await expect(page.getByLabel('予定 备注')).toHaveValue('真实收藏备注');
  expect(fixture('snapshot', userId).bookmarks).toHaveLength(1);
  await page.getByLabel('内容类型').selectOption('imports');
  await page.getByLabel('资料 JSON').fill(JSON.stringify({ fileName: 'browser.json', sourceName: 'Synthetic private fixture', sourceVersion: 'v1',
    rows: [{ kind: 'VOCABULARY', word: '旅程', reading: 'りょてい', gloss: '行程', level: 'N2', levelSource: '测试参考分级', location: '第1页' }] }));
  await page.getByRole('button', { name: '预览并校验格式' }).click();
  await expect(page.getByText(/新增 1，重复 0/)).toBeVisible();
  expect(fixture('snapshot', userId).privateWords).toHaveLength(0);
  await page.getByLabel('旅程 核对说明').fill('已对照本测试合成词条核对');
  await page.getByLabel('已对照原始来源核对读音、义项和分级').check();
  await page.getByRole('button', { name: '确认正确', exact: true }).click();
  await expect(page.getByText('校验状态已更新')).toBeVisible();
  await page.getByRole('button', { name: '提交已校验内容' }).click();
  await expect(page.getByText('已提交通过校验的内容，未通过的条目继续保留为候选。')).toBeVisible();
  const state = fixture('snapshot', userId);
  expect(state.privateWords).toHaveLength(1); expect(state.privateWords[0].ownerId).toBe(userId);
  await page.getByRole('button', { name: '预览并校验格式' }).click();
  await expect(page.getByText(/新增 0，重复 1/)).toBeVisible();
  expect(fixture('snapshot', userId).privateWords).toHaveLength(1);
  await healthy(page, errors, `real-private-import-${info.project.name}.png`);
});
