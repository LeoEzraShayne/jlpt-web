import type { Metadata } from "next";
import { AuthGate } from "@/components/app/auth-gate";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OnboardingPage() { return <AuthGate requirePlan={false}><OnboardingForm /></AuthGate>; }
