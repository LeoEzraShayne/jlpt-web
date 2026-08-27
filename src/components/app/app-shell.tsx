"use client";

import {
  Bell,
  CalendarDays,
  History,
  Library,
  RefreshCcw,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemePicker } from "@/components/theme/theme-picker";
import { FocusCycleCompact } from "@/components/focus/focus-cycle-display";
import { useMe } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/today", label: "今日", icon: CalendarDays },
  { href: "/grammar", label: "语法库", icon: Library },
  { href: "/review", label: "复习", icon: RefreshCcw },
  { href: "/history", label: "记录", icon: History },
  { href: "/profile", label: "我的", icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user } = useMe();
  const initial = user?.displayName?.slice(0, 1) || "日";
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[224px_1fr]">
      <aside className="hidden min-h-screen border-r bg-sidebar px-4 py-6 lg:flex lg:flex-col">
        <Link
          href="/today"
          className="mb-10 flex items-center gap-3 whitespace-nowrap px-2 font-semibold"
        >
          <Image
            src="/logo.svg"
            width={40}
            height={40}
            alt=""
            className="size-10 shrink-0"
          />
          <span className="text-sm">文法トレーニング</span>
        </Link>
        <nav className="space-y-2" aria-label="主导航">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="soft-grid mt-auto rounded-2xl border bg-card p-4 text-sm">
          <p className="font-semibold">今天也前进一点</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            坚持完成复习，记忆会越来越牢固。
          </p>
        </div>
      </aside>
      <div className="min-w-0 max-w-full">
        <header className="sticky top-0 z-20 flex h-16 min-w-0 items-center justify-between gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4 md:px-8">
          <Link
            href="/today"
            className="flex min-w-0 items-center gap-2 font-semibold lg:hidden"
          >
            <Image
              src="/logo.svg"
              width={24}
              height={24}
              alt=""
              className="size-6 shrink-0"
            />
            <span className="truncate text-sm sm:text-base">
              文法トレーニング
            </span>
          </Link>
          <div className="hidden lg:block" />
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {pathname.startsWith("/study/") && <FocusCycleCompact />}
            <ThemePicker compact />
            <Button
              variant="ghost"
              size="icon"
              aria-label="通知"
              className="hidden sm:inline-flex"
            >
              <Bell className="size-5" />
            </Button>
            <Avatar className="size-9">
              {user?.avatarUrl && (
                <AvatarImage
                  src={user.avatarUrl}
                  alt={`${user.displayName} 的 Google 头像`}
                  referrerPolicy="no-referrer"
                />
              )}
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">
              {user?.displayName}
            </span>
          </div>
        </header>
        <main className="mx-auto min-w-0 max-w-[1180px] overflow-x-clip px-4 pt-7 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-8 md:pt-9 lg:pb-9">
          {children}
        </main>
        <nav
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:hidden"
          aria-label="移动端导航"
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg py-3 text-[11px]",
                  active
                    ? "bg-secondary font-semibold text-secondary-foreground"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
