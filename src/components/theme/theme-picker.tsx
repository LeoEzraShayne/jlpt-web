"use client";

import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useColorTheme } from "@/components/theme/theme-provider";
import type { ThemeId } from "@/lib/api/types";
import { useMe } from "@/hooks/use-api";
import { apiRequest } from "@/lib/api/client";

const options: Array<{ id: ThemeId; name: string; color: string }> = [
  { id: "sunshine", name: "暖阳黄", color: "#F4B740" },
  { id: "coral", name: "珊瑚橙", color: "#F27B67" },
  { id: "mint", name: "薄荷绿", color: "#63C49A" },
  { id: "ocean", name: "晴空蓝", color: "#6AA9E9" },
  { id: "violet", name: "藤花紫", color: "#A78BFA" },
];

export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useColorTheme();
  const me = useMe();
  async function choose(nextTheme: ThemeId) {
    const previous = theme;
    setTheme(nextTheme);
    if (!me.data) return;
    try {
      await apiRequest("/me/preferences", { method: "PUT", body: JSON.stringify({ colorTheme: nextTheme }) });
      await me.mutate({ ...me.data, colorTheme: nextTheme }, { revalidate: false });
    } catch {
      setTheme(previous);
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={compact ? "icon" : "sm"} aria-label="选择主题颜色" className="bg-card">
          <Palette className="size-4" />{!compact && <span>主题</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>主题颜色</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuItem key={option.id} onClick={() => void choose(option.id)} className="gap-3">
            <span className="size-4 rounded-full border" style={{ backgroundColor: option.color }} />
            <span className="flex-1">{option.name}</span>
            {theme === option.id && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
