import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthGate } from "@/components/app/auth-gate";
import { AndroidLaunchPage } from "@/components/android/android-launch-page";
import { LoadingState } from "@/components/shared/loading-state";
export const metadata: Metadata = { title: "会员", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() {
  return <Suspense fallback={<LoadingState />}><AuthGate requirePlan={false}><AndroidLaunchPage /></AuthGate></Suspense>;
}
