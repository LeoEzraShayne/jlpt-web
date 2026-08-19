export type ThemeId = "sunshine" | "coral" | "mint" | "ocean" | "violet";
export type JlptLevel = "N1" | "N2" | "N3" | "N4";
export type RecallRating = "FORGOT" | "FUZZY" | "REMEMBERED";
export type SessionMode = "LEARN" | "REVIEW" | "PRACTICE";

export interface GrammarLevel {
  level: JlptLevel;
  grammarCount: number;
  contentStatus: "AVAILABLE" | "PENDING";
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  role: "USER" | "ADMIN";
  timezone: string;
  targetLevel: JlptLevel;
  colorTheme: ThemeId;
}

export interface Progress {
  id: string;
  status: "NOT_STARTED" | "LEARNING" | "DUE" | "MASTERED" | "NEEDS_WORK";
  stage: number;
  masteryScore: number;
  lastScore?: number | null;
  lastStudiedAt?: string | null;
  learningState?: {
    status: "NOT_STARTED" | "LEARNING" | "DUE" | "MASTERED" | "NEEDS_WORK";
    stabilityEstimateDays: number | null;
    difficultyEstimate: number | null;
    estimatedRetrievability: number | null;
    nextReviewOn: string | null;
    algorithmVersion: string;
    isEstimate: true;
  };
}

export interface GrammarExample {
  id: string;
  sentence: string;
  translation: string;
  sortOrder: number;
}
export interface GrammarPoint {
  id: string;
  level: JlptLevel;
  title: string;
  chineseExplanation: string;
  connectionRule?: string | null;
  usageScene?: string | null;
  commonErrors?: string | null;
  sortOrder: number;
  examples: GrammarExample[];
  progress?: Progress[];
  relationMembers?: Array<{
    group: {
      id: string;
      title: string;
      notes: string;
      members: Array<{ grammar: { id: string; title: string } }>;
    };
  }>;
  sentenceAttempts?: SentenceAttempt[];
}

export interface StudyPlan {
  id: string;
  level: JlptLevel;
  startDate: string;
  targetDate: string;
  dailyMinutes: number;
  dailyNewLimit: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  totalGrammar: number;
  learnedGrammar: number;
  remainingGrammar: number;
  recommendedDailyNew: number;
  planAtRisk?: boolean;
}

export interface StudyTask {
  id: string;
  grammarId: string;
  taskDate: string;
  type: "LEARN" | "REVIEW" | "PRACTICE";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  estimatedMinutes: number;
  dueOn: string | null;
  overdueDays: number;
  priorityGroup: "OVERDUE" | "DUE_TODAY" | "NEW";
  locked: boolean;
  grammar: GrammarPoint;
}

export interface Dashboard {
  summary: {
    newCount: number;
    reviewCount: number;
    completedCount: number;
    level: JlptLevel | null;
    totalGrammar: number;
    masteryPercent: number;
    masteredGrammar: number;
    unmasteredGrammar: number;
    learnedGrammar: number;
    trackedGrammar: number;
    overdueReviewCount: number;
  };
  estimatedMinutes: number;
  requiredReviewRemaining: number;
  newLearningUnlocked: boolean;
  nextTaskId?: string | null;
  planning: {
    budgetMinutes: number;
    plannedMinutes: number;
    dueUnscheduledCount: number;
    planAtRisk: boolean;
    algorithmVersion: string;
  };
  tasks: StudyTask[];
}

export interface ReviewResult {
  id: string;
  totalScore: number;
  grammarScore: number;
  connectionScore: number;
  completenessScore: number;
  naturalnessScore: number;
  vocabularyScore: number;
  isCorrect: boolean;
  resultLevel: "CORRECT" | "MOSTLY_CORRECT" | "NEEDS_REVISION" | "INCORRECT";
  errorSpans: Array<{
    text: string;
    start: number;
    end: number;
    reason: string;
    replacement: string;
  }>;
  correctedSentence: string;
  correctedSentenceTranslationZh?: string | null;
  alternativeSentence?: string | null;
  alternativeSentenceFurigana?: string | null;
  alternativeSentenceTranslationZh?: string | null;
  explanationZh: string;
  encouragement: string;
  usedTargetGrammar?: boolean | null;
  targetGrammarCorrect?: boolean | null;
  scorePolicyVersion?: string;
  recallPolicy?: {
    allowedRatings: RecallRating[];
    effectiveRatingCap: RecallRating | null;
    reason:
      | "NONE"
      | "SCORE_BELOW_80"
      | "TARGET_GRAMMAR_MISSING"
      | "TARGET_GRAMMAR_INCORRECT";
    scorePolicyVersion: string;
  };
}

export interface AiReviewJob {
  id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  retryCount: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  result?: ReviewResult | null;
}

export interface SentenceAttempt {
  id: string;
  sentence: string;
  scene?: string | null;
  createdAt: string;
  grammar?: { id: string; title: string } | GrammarPoint;
  aiJob?: AiReviewJob | null;
}

export interface StudySession {
  id: string;
  grammarId: string;
  taskId?: string | null;
  mode: SessionMode;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  revealedAt?: string | null;
  timer: StudyTimer;
  grammar: GrammarPoint;
  attempts: SentenceAttempt[];
  reviewOutcome?: {
    submittedRating: RecallRating;
    effectiveRating: RecallRating;
    nextReviewOn: string;
    intervalDays: number;
    stabilityEstimateDays: number | null;
    difficultyEstimate: number | null;
    algorithmVersion: string;
    isEstimate: true;
  } | null;
}

export interface StudyTimer {
  phase: "FOCUS" | "BREAK";
  phaseStartedAt: string;
  phaseEndsAt: string;
  focusMinutes: number;
  breakMinutes: number;
}

export interface ReviewSchedule {
  id: string;
  nextReviewAt: string;
  nextReviewOn?: string | null;
  estimatedRetrievability?: number | null;
  isEstimate?: true;
  group: "OVERDUE" | "DUE_TODAY" | "UPCOMING";
  estimatedMinutes: number;
  overdueDays: number;
  progress: Progress & { grammar: GrammarPoint };
}

export interface ForecastDay {
  date: string;
  reviewCount: number;
  newCount: number;
  estimatedMinutes: number;
  capacityMinutes: number;
  dueUnscheduledCount: number;
  overloaded: boolean;
}

export interface StudyPlanForecast {
  days: ForecastDay[];
  meta: {
    algorithmVersion: string;
    isEstimate: true;
    assumption: "REMEMBERED";
    projectedCompletionDate: string | null;
    targetDate: string;
    remainingNewAfterHorizon: number;
    planAtRisk: boolean;
  };
}

export interface CompletionNotice {
  submittedRating: RecallRating;
  effectiveRating: RecallRating;
  nextReviewOn: string;
}
