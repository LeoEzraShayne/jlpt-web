export function historyScoreTone(score: number) {
  if (score < 60) return "text-destructive";
  if (score < 80) return "text-sky-600";
  return "text-success";
}
