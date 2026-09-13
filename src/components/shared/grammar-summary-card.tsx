import type { ReactNode } from "react";
import { CardContent } from "@/components/ui/card";
import { LibraryCard } from "@/components/shared/library-card";

export function GrammarSummaryCard({
  metadata, title, description, footerInfo, action, headingLevel = "h2",
}: {
  metadata: ReactNode;
  title: ReactNode;
  description: ReactNode;
  footerInfo?: ReactNode;
  action: ReactNode;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <LibraryCard className="h-full max-lg:[--card-spacing:--spacing(3)]">
      <CardContent className="flex h-full min-w-0 flex-col">
        <div className="mb-3 flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
          {metadata}
        </div>
        <Heading className="min-w-0 break-words text-lg font-semibold">{title}</Heading>
        <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">{description}</p>
        <div className="mt-auto flex min-w-0 items-center justify-between gap-2 pt-4 lg:pt-3">
          {footerInfo}
          {action}
        </div>
      </CardContent>
    </LibraryCard>
  );
}
