import { GrammarDetail } from "@/components/grammar/grammar-detail";
export default async function GrammarDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <GrammarDetail id={id} />; }
