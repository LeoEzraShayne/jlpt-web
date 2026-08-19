import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-[76rem] flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>文法トレーニング — 面向中文使用者的 JLPT N1～N4 日语语法学习工具。</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="页脚导航">
          <Link href="/about" className="hover:text-foreground">关于与联系</Link>
          <Link href="/privacy" className="hover:text-foreground">隐私说明</Link>
          <Link href="/login" className="hover:text-foreground">登录</Link>
        </nav>
      </div>
    </footer>
  );
}
