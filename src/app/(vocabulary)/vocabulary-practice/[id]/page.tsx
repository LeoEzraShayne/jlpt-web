import { VocabularyPracticeWorkspace } from "@/components/vocabulary-learning/practice-workspace";
export default async function VocabularyPracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VocabularyPracticeWorkspace key={id} id={id} />;
}
