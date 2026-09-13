import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function DashboardActionCard({ icon: Icon, label, children, footer, ariaLabel }: {
  icon: LucideIcon;
  label: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <Card aria-label={ariaLabel} className="h-full min-w-0 border-primary/40 warm-shadow [--card-spacing:--spacing(4)]">
      <CardContent className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
            <Icon className="size-4" />
          </span>
          <p className="min-w-0 text-sm font-semibold text-primary">{label}</p>
        </div>
        <div className="mt-5 min-w-0">{children}</div>
        <div className="mt-auto w-full min-w-0 pt-1 [&_[data-slot=button]]:min-w-0 [&_[data-slot=button]]:whitespace-nowrap [&_[data-slot=button]]:px-2.5">{footer}</div>
      </CardContent>
    </Card>
  );
}
