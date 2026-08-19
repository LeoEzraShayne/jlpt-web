import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const publicLinks = [
  { href: "/#features", label: "功能" },
  { href: "/#how-it-works", label: "学习方式" },
  { href: "/#faq", label: "常见问题" },
  { href: "/about", label: "关于" },
];

export function PublicHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[76rem] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 font-semibold">
          <Image src="/logo.svg" width={36} height={36} alt="文法トレーニング标志" />
          <span className="truncate">文法トレーニング</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex" aria-label="公开页面导航">
          {publicLinks.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm">
          <Link href="/login">登录学习</Link>
        </Button>
      </div>
    </header>
  );
}
