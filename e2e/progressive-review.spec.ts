import { expect, test, type Page } from './adult-fixture';
import { expectNoHorizontalOverflow } from './layout';

async function mock(page: Page) {
  let submitted = false;
  let phase: 'CORE' | 'DONE' | 'LEGACY' | 'INCORRECT' = 'CORE';
  const writes: Record<string, unknown>[] = [];
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const grammar = { id: 'g1', title: '～ながら', level: 'N1', chineseExplanation: '一边……一边……', examples: [], progress: [] };
  const core = { id: 'result', totalScore: 100, grammarScore: 30, connectionScore: 20, completenessScore: 20, naturalnessScore: 20, vocabularyScore: 10,
    isCorrect: true, usedTargetGrammar: true, targetGrammarCorrect: true, resultLevel: 'CORRECT', errorSpans: [],
    correctedSentence: 'あるきながらはなします。', correctedSentenceFurigana: 'あるきながらはなします。', correctedSentenceTranslationZh: '边走边说。',
    explanationZh: '语法使用正确。', encouragement: '表达准确。', recallPolicy: { allowedRatings: ['FORGOT', 'FUZZY', 'REMEMBERED'], reason: 'NONE' } };
  const job = () => ({ id: 'r1', status: phase === 'CORE' ? 'PROCESSING' : 'COMPLETED', retryCount: 0,
    result: phase === 'CORE' ? null : { ...core,
      ...(phase === 'LEGACY' ? { alternativeSentence: 'たべながらはなします。', alternativeSentenceFurigana: 'たべながらはなします。', alternativeSentenceTranslationZh: '边吃边说。', diversityAdvice: '换一个表达目的。', nextPractice: '描述工作时的动作。' } : {}),
      ...(phase === 'INCORRECT' ? { totalScore: 50, grammarScore: 0, connectionScore: 0, encouragement: '注意动作主体。', isCorrect: false, targetGrammarCorrect: false, resultLevel: 'INCORRECT',
        explanationZh: 'ながら前后应为同一个动作主体。', correctedSentence: '私は音楽を聞きながら勉強します。', correctedSentenceFurigana: '私[わたし]は音楽[おんがく]を聞[き]きながら勉強[べんきょう]します。', correctedSentenceTranslationZh: '我一边听音乐一边学习。',
        errorSpans: [{ text: '彼は', replacement: '私は', reason: '前后两个动作需要同一主体。', start: 0, end: 2 }],
        recallPolicy: { allowedRatings: ['FORGOT', 'FUZZY'], reason: 'TARGET_GRAMMAR_INCORRECT' } } : {}) } });
  await page.route('**/api/v1/**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    const headers = { 'access-control-allow-origin': request.headers().origin ?? '*', 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers }); return; }
    let data: unknown = {};
    if (path.endsWith('/me')) data = { id: 'u1', displayName: '测试用户', role: 'USER', targetLevel: 'N1', timezone: 'Asia/Tokyo', colorTheme: 'sunshine' };
    else if (path.endsWith('/study-plans')) data = { items: [{ id: 'p1', level: 'N1', status: 'ACTIVE' }], nextCursor: null };
    else if (path.endsWith('/study-sessions/progressive')) data = { id: 'progressive', grammarId: 'g1', mode: 'REVIEW', status: 'ACTIVE', grammar, attempts: submitted ? [{ id: 'a1', aiJob: job() }] : [], timer: { phase: 'FOCUS', phaseStartedAt: new Date().toISOString(), phaseEndsAt: new Date(Date.now() + 600000).toISOString(), focusMinutes: 30, breakMinutes: 5 } };
    else if (path.endsWith('/sentence-reviews') && request.method() === 'POST') { submitted = true; data = { reviewId: 'r1', status: 'QUEUED' }; }
    else if (path.endsWith('/sentence-reviews/r1')) data = job();
    else if (path.endsWith('/sentence-attempts/a1')) data = { id: 'a1', sentence: core.correctedSentence, createdAt: new Date().toISOString(), grammar, aiJob: job() };
    else if (path.endsWith('/complete') || path.endsWith('/expressions')) { writes.push({ path, ...request.postDataJSON() }); data = { id: 'saved', status: 'COMPLETED' }; }
    else if (path.endsWith('/dashboard/today')) data = { summary: { level: 'N1', totalGrammar: 40 }, tasks: [], estimatedMinutes: 0, planning: { dueUnscheduledCount: 0 } };
    await route.fulfill({ status: 200, headers, contentType: 'application/json', body: JSON.stringify({ data }) });
  });
  return { writes, errors, setPhase: (next: typeof phase) => { phase = next; } };
}
async function submit(page: Page) {
  await page.goto('/study/progressive');
  await page.getByLabel('日语句子').fill('あるきながらはなします。');
  await page.getByRole('button', { name: '提交给 AI 批改' }).click();
  await expect(page.getByText('AI 正在批改…')).toBeVisible();
}

test('core-only feedback completes immediately without auxiliary cards or bookmark form', async ({ page }, info) => {
  const api = await mock(page); await submit(page); api.setPhase('DONE');
  await expect(page.getByText('这次记得怎么样？')).toBeVisible();
  await expect(page.getByRole('button', { name: '记住了', exact: true })).toBeEnabled();
  await expect(page.getByRole('heading', { name: '需要调整的地方', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('语法使用正确。', { exact: true })).toBeVisible();
  for (const name of ['内容回应', '拓展示例', '表达变化建议', '后续练习', '收藏想熟练使用的表达'])
    await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(0);
  await expect(page.getByText(/正在补充拓展/)).toHaveCount(0);
  await page.screenshot({ path: `/tmp/jlpt-core-only-${info.project.name}.png`, fullPage: true });
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: '记住了', exact: true }).click();
  await expect.poll(() => api.writes.length).toBe(1);
  expect(api.writes[0].sentenceReviewId).toBe('r1');
  await expect(page).toHaveURL(/\/today$/); expect(api.errors).toEqual([]);
});

test('specific correction card, replacement, reason, readings and Chinese translation remain visible', async ({ page }, info) => {
  const api = await mock(page); await submit(page); api.setPhase('INCORRECT');
  await expect(page.getByRole('heading', { name: '需要调整的地方', exact: true })).toBeVisible();
  await expect(page.getByText('彼は', {exact: true})).toBeVisible();
  await expect(page.getByText('私は', {exact: true})).toBeVisible();
  await expect(page.getByText('前后两个动作需要同一主体。', {exact: true})).toBeVisible();
  await expect(page.getByText(/我一边听音乐一边学习。/)).toBeVisible();
  await expect(page.locator('rt').first()).toBeAttached();
  await expect(page.getByRole('button', { name: '收藏表达', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '记住了', exact: true })).toHaveCount(0);
  await page.screenshot({ path: `/tmp/jlpt-core-corrections-${info.project.name}.png`, fullPage: true });
  await expectNoHorizontalOverflow(page); expect(api.errors).toEqual([]);
});

test('history keeps old examples but hides removed advice and bookmark cards', async ({ page }) => {
  const api = await mock(page); api.setPhase('LEGACY');
  await page.goto('/history/a1');
  await expect(page.getByRole('heading', { name: '拓展示例', exact: true })).toBeVisible();
  for (const name of ['表达变化建议', '后续练习', '收藏想熟练使用的表达'])
    await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page); expect(api.errors).toEqual([]);
});
