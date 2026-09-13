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
    <Card aria-label={ariaLabel} className="h-full min-w-0 border-primary/40 warm-shadow">
      <CardContent className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary">{label}</p>
          {children}
        </div>
        <div className="col-span-2 mt-auto w-full min-w-0">{footer}</div>
      </CardContent>
    </Card>
  );
}
