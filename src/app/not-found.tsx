import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() { return <main className="grid min-h-screen place-items-center p-5 text-center"><div><p className="text-6xl font-bold text-primary">404</p><h1 className="mt-4 text-2xl font-bold">这个页面不存在</h1><p className="mt-2 text-muted-foreground">返回今日学习，继续完成你的计划。</p><Button asChild className="mt-6"><Link href="/today">返回今日</Link></Button></div></main>; }
