import Link from "next/link";
import { VocabularyLearningList } from "@/components/vocabulary-learning/learning-list";
import { VocabularyTodaySummary } from "@/components/vocabulary-learning/today-summary";
export default function VocabularyLearningPage() {
  return <div className="min-w-0 space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">词汇学习清单</h1><Link href="/library" className="text-sm underline">查询并添加词汇</Link></div><VocabularyTodaySummary /><VocabularyLearningList /></div>;
}
