import type { Metadata } from "next";
import { AuthGate } from "@/components/app/auth-gate";
import { StudyWorkspace } from "@/components/study/study-workspace";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function StudyPage({ params }: { params: Promise<{ sessionId: string }> }) { const { sessionId } = await params; return <AuthGate><StudyWorkspace sessionId={sessionId} /></AuthGate>; }
