import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/components/auth/login-view";
import { LoadingState } from "@/components/shared/loading-state";

export const metadata: Metadata = {
  title: "Google 登录",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default function LoginPage() { return <Suspense fallback={<LoadingState />}><LoginView /></Suspense>; }
