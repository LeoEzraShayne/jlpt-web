import { BookOpenText } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed bg-card p-8 text-center"><div><div className="flex items-center justify-center gap-2"><BookOpenText className="size-8 shrink-0 text-primary" /><h3 className="font-semibold">{title}</h3></div><p className="mt-2 text-sm text-muted-foreground">{description}</p></div></div>;
}
