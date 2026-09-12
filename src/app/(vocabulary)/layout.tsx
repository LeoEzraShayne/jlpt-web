import type { Metadata } from "next";
import { AuthGate } from "@/components/app/auth-gate";
import { AppShell } from "@/components/app/app-shell";
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function VocabularyLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate requirePlan={false}><AppShell>{children}</AppShell></AuthGate>;
}
