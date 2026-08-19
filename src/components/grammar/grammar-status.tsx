import { Badge } from "@/components/ui/badge";
import type { Progress } from "@/lib/api/types";

export type LearningStatus = Progress["status"];

const labels: Record<LearningStatus, string> = {
  NOT_STARTED: "未学习",
  LEARNING: "巩固中",
  DUE: "今天复习",
  MASTERED: "较稳定",
  NEEDS_WORK: "需加强",
};
const styles: Record<LearningStatus, string> = {
  NOT_STARTED: "bg-muted text-muted-foreground",
  LEARNING: "bg-secondary text-secondary-foreground",
  DUE: "bg-violet-100 text-violet-700",
  MASTERED: "bg-emerald-100 text-emerald-700",
  NEEDS_WORK: "bg-red-50 text-red-700",
};

export function learningStatus(progress?: Progress): LearningStatus {
  return progress?.learningState?.status ?? progress?.status ?? "NOT_STARTED";
}

export function GrammarStatus({ progress }: { progress?: Progress }) {
  const status = learningStatus(progress);
  return (
    <Badge className={`${styles[status]} border-0`}>{labels[status]}</Badge>
  );
}
