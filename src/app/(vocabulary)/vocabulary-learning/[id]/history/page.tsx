import { VocabularyLearningHistory } from "@/components/vocabulary-learning/learning-history";
export default async function VocabularyHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VocabularyLearningHistory key={id} vocabularyId={id} />;
}
