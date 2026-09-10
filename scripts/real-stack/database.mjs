import { createRequire } from 'node:module';
import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const api = process.env.REAL_API_DIR;
if (!api) throw new Error('REAL_API_DIR is required');
const require = createRequire(resolve(api, 'package.json'));
export const { Client } = require('pg');
export function database() {
  const url = new URL(process.env.DATABASE_URL);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !/^\/jlpt_v2_test_browser_[a-z0-9_]+$/.test(url.pathname))
    throw new Error('Only isolated local browser databases are allowed');
  const { PrismaClient } = require('@prisma/client');
  const { PrismaPg } = require('@prisma/adapter-pg');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url.href }) });
}
export async function seed() {
  const db = database();
  try {
    for (const [index, level] of ['N1', 'N2', 'N3', 'N4'].entries()) {
      await db.grammarPoint.create({ data: {
        id: `browser-${level}`, level, title: index === 0 ? '～を踏まえて' : '～ために',
        chineseExplanation: '以……为依据', connectionRule: '名词＋を踏まえて',
        sortOrder: 1, sourceDataset: 'synthetic-browser', sourceOrdinal: 1, sourceHash: level,
        examples: { create: { sentence: '結果を踏まえて決めます。', translation: '根据结果决定。' } },
      } });
    }
    await db.vocabularyEntry.create({ data: {
      id: 'browser-word', fingerprint: 'browser-word', word: '予定', reading: 'よてい', senseKey: 'schedule',
      partOfSpeech: ['noun'], glosses: [{ language: 'eng', text: 'schedule' }], chineseGloss: '计划',
      chineseGlossSource: 'synthetic browser fixture', level: 'N4', levelSource: 'synthetic reference',
      sourceName: 'JMdict fixture', sourceVersion: 'test-v1', validationStatus: 'VALIDATED', provenance: {},
    } });
  } finally { await db.$disconnect(); }
}
async function account(db) {
  const id = `browser-${randomUUID()}`;
  const token = randomUUID();
  await db.user.create({ data: { id, email: `${id}@example.invalid`, displayName: '真实联调测试',
    learningV2Enabled: true, dailyMinutes: 30, primaryShare: 80 } });
  await db.authSession.create({ data: { userId: id,
    tokenHash: createHash('sha256').update(`${token}:${process.env.SESSION_SECRET}`).digest('hex'),
    expiresAt: new Date(Date.now() + 86400000) } });
  const startDate = new Date(); startDate.setUTCDate(startDate.getUTCDate() - 1); startDate.setUTCHours(0, 0, 0, 0);
  await db.studyPlan.create({ data: { userId: id, level: 'N1', startDate,
    targetDate: new Date(Date.now() + 60 * 86400000), dailyMinutes: 30, dailyNewLimit: 2 } });
  return { id, token };
}
async function result(db, jobId) {
  const job = await db.aiReviewJob.findUniqueOrThrow({ where: { id: jobId } });
  if (job.status !== 'QUEUED') throw new Error('Worker must remain disabled');
  await db.aiReviewResult.create({ data: {
    jobId, provider: 'DEEPSEEK', model: 'synthetic-browser-fixture', promptVersion: 'test-v1',
    totalScore: 90, rawTotalScore: 90, grammarScore: 30, connectionScore: 20, completenessScore: 20,
    naturalnessScore: 12, vocabularyScore: 8, isCorrect: true, usedTargetGrammar: true,
    targetGrammarCorrect: true, resultLevel: 'CORRECT', errorSpans: [], latencyMs: 1,
    correctedSentence: '結果を踏まえて決めます。', correctedSentenceFurigana: '結果[けっか]を踏[ふ]まえて決[き]めます。',
    correctedSentenceTranslationZh: '根据结果决定。', alternativeSentence: '結果を踏まえて予定を調整します。',
    alternativeSentenceFurigana: '結果[けっか]を踏[ふ]まえて予定[よてい]を調整[ちょうせい]します。',
    alternativeSentenceTranslationZh: '根据结果调整计划。', scenarioTaskCompleted: true,
    contentResponse: '说明依据后，对方更容易理解你的决定。', explanationZh: '目标语法使用正确。',
    encouragement: '表达清楚', diversityAdvice: '简单正确的句子同样有效。', nextPractice: '换成旅行场景，解释行程变化。',
  } });
  await db.aiReviewJob.update({ where: { id: jobId }, data: { status: 'COMPLETED' } });
  return { jobId };
}
async function due(db, userId) {
  const progress = await db.userGrammarProgress.findUniqueOrThrow({ where: { userId_grammarId: { userId, grammarId: 'browser-N1' } } });
  const yesterday = new Date(Date.now() - 86400000); yesterday.setUTCHours(0, 0, 0, 0);
  await db.reviewSchedule.update({ where: { progressId: progress.id }, data: { nextReviewAt: yesterday, nextReviewOn: yesterday } });
  return { progressId: progress.id };
}
async function snapshot(db, userId) {
  return {
    user: await db.user.findUnique({ where: { id: userId } }),
    plans: await db.studyPlan.findMany({ where: { userId } }),
    tasks: await db.studyTask.findMany({ where: { userId } }),
    sessions: await db.studySession.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    events: await db.reviewEvent.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    expressions: await db.personalExpression.findMany({ where: { userId } }),
    bookmarks: await db.vocabularyBookmark.findMany({ where: { userId } }),
    imports: await db.contentImport.findMany({ where: { userId } }),
    candidates: await db.contentCandidate.findMany({ where: { userId } }),
    privateWords: await db.vocabularyEntry.findMany({ where: { ownerId: userId } }),
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const db = database();
  try {
    const actions = { account, result, due, snapshot };
    const action = actions[process.argv[2]];
    if (!action) throw new Error('Unknown fixture action');
    console.log(JSON.stringify(await action(db, process.argv[3])));
  } finally { await db.$disconnect(); }
}
