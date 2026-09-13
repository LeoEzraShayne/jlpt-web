// Synthetic data shared by responsive regression tests and local visual QA.
export const fixtureGrammar = Array.from({ length: 4 }, (_, index) => ({
  id: `layout-g${index}`, level: "N1", sortOrder: index + 1,
  title: ["～を皮切りに（して）・～を皮切りとして", "～にかかわる", "～いかんによらず・～いかんにかかわらず", "～ともあろう"][index],
  chineseExplanation: "以……为开端；从……开始，随后同类活动陆续展开。用于验证长说明的显示。",
  connectionRule: "名词＋を皮切りに", examples: [],
  displayTitle: "Starting with a particular event, followed by a series of similar activities",
  localized: { resolvedLocale: "en", status: "VALIDATED", fields: { explanation: "Beginning with this event, similar activities continue to develop." } },
  progress: [{ id: `layout-p${index}`, status: "LEARNING", lastScore: index === 1 ? null : 59 + index * 10,
    learningState: { status: "LEARNING", nextReviewOn: "2026-12-31" } }],
}));
const plans = ["N1", "N2", "N3", "N4"].map((level, index) => ({
  id: `layout-plan${index}`, level, mode: index ? "GAP_FILL" : "SYSTEM", status: "ACTIVE",
  startDate: "2026-09-13T12:00:00.000Z", targetDate: "2027-12-31T12:00:00.000Z",
  dailyNewLimit: 10, learnedGrammar: 10, totalGrammar: 100, remainingGrammar: 90,
}));
const tasks = Array.from({ length: 6 }, (_, index) => ({
  id: `layout-task${index}`, grammarId: fixtureGrammar[index % 3].id,
  grammar: fixtureGrammar[index % 3], type: index < 3 ? "REVIEW" : "LEARN", status: "PENDING",
  estimatedMinutes: 4, priorityGroup: index < 3 ? "OVERDUE" : "NEW", overdueDays: 1, locked: index >= 3,
}));
const preferences: Record<string, unknown> = {};
export function layoutFixtureResponse(path: string, method = "GET", body: Record<string, unknown> = {}) {
  const url = new URL(path, "http://fixture.invalid");
  const route = url.pathname.replace(/^\/api\/v1/, "");
  let data: unknown = {};
  let meta: Record<string, unknown> | undefined;
  if (route === "/me") data = { id: "layout-user", email: "layout@example.invalid", displayName: "布局预览", role: "USER", targetLevel: "N1", timezone: "Asia/Tokyo", colorTheme: "sunshine", ...preferences };
  else if (route === "/me/preferences" && method === "PUT") { Object.assign(preferences, body); data = preferences; }
  else if (route === "/me/entitlements") data = { isMember: true, expiresAt: "2027-09-13T08:58:15Z", salesEnabled: false, quota: { enforcementEnabled: false, dailyLimit: 5, remaining: 5, consumed: 0, reserved: 0, rewardBalance: 0 } };
  else if (route === "/study-plans") data = { items: plans };
  else if (route === "/study-plans/current") data = plans[0];
  else if (/^\/study-plans\/layout-plan\d$/.test(route)) data = { ...plans[Number(route.at(-1))], ...body };
  else if (route.endsWith("/forecast")) { data = []; meta = { isEstimate: true, assumption: "REMEMBERED", projectedCompletionDate: "2027-12-01", targetDate: "2027-12-31", remainingNewAfterHorizon: 90 }; }
  else if (route === "/grammar-levels") data = plans.map(p => ({ level: p.level, grammarCount: 100, contentStatus: "AVAILABLE" }));
  else if (route === "/grammar-points") {
    const query = url.searchParams.get("query") ?? "";
    data = (url.searchParams.has("cursor") ? fixtureGrammar.slice(3) : fixtureGrammar.slice(0, 3)).filter(g => g.title.includes(query));
    if (!url.searchParams.has("cursor") && !query) meta = { nextCursor: "layout-next" };
  } else if (route.startsWith("/grammar-points/")) data = fixtureGrammar.find(g => route.endsWith(g.id));
  else if (route === "/dashboard/today") data = {
    tasks, nextTaskId: tasks[0].id, estimatedMinutes: 102, requiredReviewRemaining: 3, newLearningUnlocked: false,
    summary: { level: "N1", totalGrammar: 100, reviewCount: 3, overdueReviewCount: 3, dueTodayReviewCount: 0, newCount: 3, completedCount: 0, masteredGrammar: 5, learningGrammar: 10, needsWorkGrammar: 5, notStartedGrammar: 80 },
    planning: { plannedMinutes: 102, dueUnscheduledCount: 0 },
  };
  else if (route === "/review-queue") {
    data = Array.from({ length: 6 }, (_, index) => ({ id: `layout-r${index}`, group: index < 3 ? "OVERDUE" : "DUE_TODAY", overdueDays: index < 3 ? 1 : 0, estimatedMinutes: 4, progress: { grammar: fixtureGrammar[index % 3] } }));
    meta = { counts: { overdue: 3, dueToday: 3, upcoming: 0 } };
  } else if (route === "/sentence-attempts") {
    data = (url.searchParams.has("cursor") ? fixtureGrammar.slice(3) : fixtureGrammar.slice(0, 3)).map((grammar, index) => ({
      id: `layout-a${grammar.id}`, grammar, createdAt: "2026-09-13T23:58:59.000Z", sentence: "東京での公演を皮切りに、全国各地で公演が行われることになりました。",
      aiJob: index === 1 ? null : { result: { totalScore: 59 + index * 10 } },
    }));
    if (!url.searchParams.has("cursor")) meta = { nextCursor: "layout-next" };
  } else if (route === "/study-sessions" && method === "POST") data = { session: { id: "layout-session" } };
  else if (route === "/study-sessions/layout-session") data = { id: "layout-session", grammar: fixtureGrammar[0], grammarId: fixtureGrammar[0].id, mode: "REVIEW", status: "ACTIVE", attempts: [] };
  else if (route === "/vocabulary-learning/summary") data = { dueCount: 0, completedTodayCount: 0, unknownCount: 0, practiceCount: 0, rememberedCount: 0 };
  else if (route.includes("notifications")) data = { items: [], unreadCount: 0 };
  return { data, ...(meta ? { meta } : {}) };
}
