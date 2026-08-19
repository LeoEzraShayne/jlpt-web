"use client";
import { ErrorState } from "@/components/shared/error-state";
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) { return <main className="mx-auto max-w-3xl px-4 py-20"><ErrorState message={error.message} onRetry={reset} /></main>; }
