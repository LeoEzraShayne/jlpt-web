import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "正在加载…" }: { label?: string }) {
  return <div className="grid min-h-64 place-items-center text-sm text-muted-foreground"><span className="flex items-center gap-2"><LoaderCircle className="size-5 animate-spin text-primary" />{label}</span></div>;
}
