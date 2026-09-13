import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthGate } from "@/components/app/auth-gate";
import { AndroidLinkPage } from "@/components/android/android-link-page";
import { LoadingState } from "@/components/shared/loading-state";

export const metadata: Metadata = { title: "连接安卓应用", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() {
  return <Suspense fallback={<LoadingState />}><AuthGate requirePlan={false}><AndroidLinkPage /></AuthGate></Suspense>;
}
