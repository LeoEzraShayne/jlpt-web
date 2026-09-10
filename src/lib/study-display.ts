import type {
  CompletionNotice,
  RecallRating,
  StudyTask,
  StudySession,
} from "@/lib/api/types";

export const COMPLETION_NOTICE_KEY = "jlpt:completion-notice:v1";

export const recallLabels: Record<RecallRating, string> = {
  FORGOT: "忘记了",
  FUZZY: "有些模糊",
  REMEMBERED: "记住了",
};

export function getNewGrammarDescription({
  newLearningUnlocked,
  tasks,
}: {
  newLearningUnlocked: boolean;
  tasks: Array<Pick<StudyTask, "type">>;
}) {
  if (!newLearningUnlocked) return "先巩固到期内容，再学习新语法";
  return tasks.some((task) => task.type === "REVIEW")
    ? "复习已完成，可以开始新内容"
    : "请开始第1次学习";
}

export function formatStudyDate(dateKey: string, includeYear = false) {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;
  return includeYear ? `${year}年${month}月${day}日` : `${month}月${day}日`;
}

type DetailedCompletionNotice = CompletionNotice & Partial<NonNullable<StudySession["reviewOutcome"]>>;

export function saveCompletionNotice(notice: DetailedCompletionNotice) {
  window.sessionStorage.setItem(COMPLETION_NOTICE_KEY, JSON.stringify(notice));
}

export function consumeCompletionNotice(): DetailedCompletionNotice | null {
  const raw = window.sessionStorage.getItem(COMPLETION_NOTICE_KEY);
  window.sessionStorage.removeItem(COMPLETION_NOTICE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DetailedCompletionNotice;
  } catch {
    return null;
  }
}
