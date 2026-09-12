"use client";
import { BootstrapText } from "@/components/locale/bootstrap-text";
import { useLocale } from "@/components/locale/locale-provider";
import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "正在加载…" }: { label?: string }) {
  useLocale();
  return <div role="status" className="grid min-h-64 place-items-center text-sm text-muted-foreground"><span className="flex items-center gap-2"><LoaderCircle className="size-5 animate-spin text-primary" /><BootstrapText source={label} /></span></div>;
}
