import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { localeBootstrapScript } from "@/lib/i18n/document-locale";
import { AppProviders } from "@/components/app/app-providers";
import { androidSurfaceBootstrapScript } from "@/lib/android-commerce";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const siteUrl = new URL("https://jlpt.meritledger.org");
const themeScript = `try{var t=localStorage.getItem("jlpt-color-theme");if(["sunshine","coral","mint","ocean","violet"].indexOf(t)>-1){document.documentElement.setAttribute("data-theme",t)}}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "JLPT N1～N4 日语语法学习｜JLPT Sentence Lab",
    template: "%s｜JLPT Sentence Lab",
  },
  description: "通过日语造句、AI 语法批改和间隔复习，系统掌握 JLPT N1～N4 日语语法。包含中文解释、接续、例句和个性化学习计划。",
  applicationName: "JLPT Sentence Lab",
  keywords: ["JLPT", "JLPT N1", "JLPT N2", "JLPT N3", "JLPT N4", "日语语法", "日语学习", "日语造句", "日本語文法"],
  authors: [{ name: "JLPT Sentence Lab" }],
  creator: "JLPT Sentence Lab",
  category: "education",
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: "JLPT Sentence Lab",
    title: "JLPT N1～N4 日语语法学习｜JLPT Sentence Lab",
    description: "用日语造句、AI 批改和间隔复习，真正掌握 JLPT N1～N4 语法。",
  },
  twitter: {
    card: "summary_large_image",
    title: "JLPT N1～N4 日语语法学习｜JLPT Sentence Lab",
    description: "用日语造句、AI 批改和间隔复习，真正掌握 JLPT N1～N4 语法。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  referrer: "strict-origin-when-cross-origin",
  appleWebApp: { capable: true, title: "JLPT Sentence Lab", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4b740",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen`}>
        <script dangerouslySetInnerHTML={{ __html: themeScript + localeBootstrapScript + androidSurfaceBootstrapScript }} />
        <ThemeProvider><AppProviders>{children}</AppProviders></ThemeProvider>
      </body>
    </html>
  );
}
