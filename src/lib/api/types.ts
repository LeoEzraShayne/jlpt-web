export interface LocalizedContent {
  requestedLocale: "zh" | "en";
  resolvedLocale: "zh" | "en" | null;
  status: "ORIGINAL" | "VALIDATED" | "MISSING" | "STALE";
  sourceHash: string;
  fields: Partial<Record<"explanation" | "connectionRule" | "usageScene" | "commonErrors" | "translation" | "title" | "notes" | "domain" | "objective" | "register" | "prompt", string | null>> | null;
}

export type ThemeId = "sunshine" | "coral" | "mint" | "ocean" | "violet";
export type JlptLevel = "N1" | "N2" | "N3" | "N4";
export type RecallRating = "FORGOT" | "FUZZY" | "REMEMBERED";
export type StudyPlanMode = "SYSTEM" | "GAP_FILL";
export type TrainingMode = "UNDERSTAND" | "SUBSTITUTE" | "COMBINE" | "TRANSFER";
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
  uiLocale?: "zh" | "en";
  explanationLocale?: "zh" | "en";
  targetLevel: JlptLevel;
  colorTheme: ThemeId;
  dailyMinutes?: number;
  primaryShare?: number;
  learningV2Enabled?: boolean;
}

export interface Progress {
  id: string;
  status: "NOT_STARTED" | "LEARNING" | "DUE" | "MASTERED" | "NEEDS_WORK";
  stage: number;
  masteryScore: number;
  needsWork?: boolean;
  masteryRuleVersion?: string;
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
  localized?: LocalizedContent | null;
  id: string;
  sentence: string;
  translation: string;
  sortOrder: number;
}
export interface GrammarPoint {
  localized?: LocalizedContent | null;
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
      localized?: LocalizedContent | null;
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
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  mode?: StudyPlanMode;
  totalGrammar: number;
  learnedGrammar: number;
  remainingGrammar: number;
  recommendedDailyNew: number;
  planAtRisk?: boolean;
}

export interface StudyTask {
  id: string;
  grammarId: string;
  planId?: string | null;
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
  levels?: Array<{
    planId: string; level: JlptLevel; mode: StudyPlanMode; isPrimary: boolean;
    totalGrammar: number; masteredGrammar: number; learnedGrammar: number;
    newCount: number; reviewCount: number; completedCount: number; estimatedMinutes: number;
  }>;
  allocation?: {
    primaryMinutes: number; foundationMinutes: number; spentMinutes: number;
    remainingMinutes: number; overrunMinutes: number;
    primaryPlannedMinutes: number; foundationPlannedMinutes: number; reservedMinutes?: number;
  };
  backlog?: { count: number; overdueCount: number };
  summary: {
    newCount: number;
    reviewCount: number;
    completedCount: number;
    pendingNewCount?: number;
    inProgressNewCount?: number;
    pendingReviewCount?: number;
    inProgressReviewCount?: number;
    plannedReviewRemainingCount?: number;
    dueTodayReviewCount?: number;
    upcomingReviewCount?: number;
    completedTodayCount?: number;
    completedTodayReviewCount?: number;
    completedTodayNewCount?: number;
    caughtUpOverdueTodayCount?: number;
    studyMinutesToday?: number;
    level: JlptLevel | null;
    totalGrammar: number;
    masteryPercent: number;
    masteredGrammar: number;
    learningGrammar?: number;
    needsWorkGrammar?: number;
    notStartedGrammar?: number;
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
    overdueUnscheduledCount?: number;
    dueTodayUnscheduledCount?: number;
    planAtRisk: boolean;
    algorithmVersion: string;
  };
  tasks: StudyTask[];
}

export interface ReviewResult {
  localizedFeedback?: {
    explanation: string;
    correctedSentenceTranslation: string | null;
    alternativeSentenceTranslation?: string | null;
    encouragement: string;
    errorSpans: Array<{text: string; start: number; end: number; reason: string; replacement: string}>;
    contentResponse?: string | null;
  } | null;
  explanationLocale?: "zh" | "en";
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
  correctedSentenceFurigana?: string | null;
  correctedSentenceTranslationZh?: string | null;
  alternativeSentence?: string | null;
  alternativeSentenceFurigana?: string | null;
  alternativeSentenceTranslationZh?: string | null;
  contentResponse?: string | null;
  diversityAdvice?: string | null;
  nextPractice?: string | null;
  scenarioTaskCompleted?: boolean | null;
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
  explanationLocale?: "zh" | "en";
  id: string;
  grammarId: string;
  taskId?: string | null;
  scenarioId?: string | null;
  trainingMode?: TrainingMode | null;
  trainingContext?: TrainingContext | null;
  mode: SessionMode;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  revealedAt?: string | null;
  hintRevealCount?: number;
  timer: StudyTimer;
  grammar: GrammarPoint;
  attempts: SentenceAttempt[];
  reviewOutcome?: {
    submittedRating: RecallRating;
    effectiveRating: RecallRating;
    nextReviewOn: string;
    intervalDays: number;
    evidenceVersion?: string;
    dueReview?: boolean;
    assessmentAvailable?: boolean;
    eligibleMasteryReview?: boolean;
    nextReviewStillDue?: boolean;
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

export interface TrainingContext {
  explanationLocale?: "zh" | "en";
  instruction?: string;
  version?: "training-v1";
  instructionZh?: string;
  scenario?: {
    localized?: LocalizedContent | null;
    version: "scenario-v1"; id: string; scenarioId: string; taskId: string;
    objectiveId: string; domain: string; objective: string; register: string; promptZh: string;
  } | null;
  words?: Array<{
    id: string; word: string; reading: string; chineseGloss: string | null;
    glosses: Array<{ language: string; text: string }>;
    sourceName: string; sourceVersion: string;
  }>;
  supportingGrammar?: { id: string; title: string; level: JlptLevel } | null;
  expressions?: Array<{
    id: string; hidden?: boolean; sentence?: string; furigana?: string | null;
    translationZh?: string | null; provenance?: unknown;
  }>;
  phrases?: Array<{
    id: string; hidden?: boolean; word?: string; reading?: string;
    payload?: { gloss?: string; [key: string]: unknown };
  }>;
  referenceHidden?: boolean;
}

export interface StudyPlanList {
  items: StudyPlan[];
  nextCursor: string | null;
}
export interface VocabularyLearningState {
  id: string;
  vocabularyId: string;
  knowledge: "UNKNOWN" | "KNOWN" | "REMEMBERED";
  practiceEnabled: boolean;
  paused: boolean;
  manualRevision: number;
  nextReviewAt: string | null;
  lastPracticedAt: string | null;
  lastOutcome: string | null;
}
export interface VocabularyEntry {
  learning?: VocabularyLearningState | null;
  id: string; word: string; reading: string; senseKey: string; partOfSpeech: string[];
  glosses: Array<{language: string; text: string; type?: string | null}>;
  chineseGloss: string | null; chineseGlossSource: string | null;
  level: JlptLevel | null; levelSource: string | null;
  sourceName: string; sourceUrl: string | null; sourceVersion: string;
  license: string | null; validationStatus: string; ownerId: string | null;
}
export interface PersonalExpression {
  id: string; grammarId: string; reviewId: string;
  variant: "ORIGINAL" | "CORRECTION" | "ALTERNATIVE";
  sentence: string; furigana: string | null; translationZh: string | null;
  scenarioId: string | null; scene: string | null; note: string;
  createdAt: string; updatedAt: string;
}
export interface ContentImport {
  id: string; fileName: string; sourceName: string; sourceVersion: string;
  status: string; summary: Record<string, unknown>; createdAt: string;
}
export interface ContentCandidate {
  id: string; kind: "VOCABULARY" | "PHRASE"; word: string; reading: string;
  senseKey: string; payload: Record<string, unknown>;
  validationStatus: "PENDING" | "VALIDATED" | "REJECTED"; validationNotes: string;
}
