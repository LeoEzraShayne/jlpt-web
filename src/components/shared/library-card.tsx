import type { ComponentProps } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LibraryCardGrid({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid min-w-0 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3", className)} {...props} />;
}
export function LibraryCard({ className, ...props }: ComponentProps<typeof Card>) {
  return <Card className={cn("min-w-0 warm-shadow md:h-full md:min-h-44", className)} {...props} />;
}
