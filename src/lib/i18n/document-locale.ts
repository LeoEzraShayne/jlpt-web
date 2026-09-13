import type { AppLocale } from "@/lib/api/sentence-lab";

const brands = { zh: "日语造句实验室", en: "JLPT Sentence Lab" };
const titles: Record<string, { zh: string; en: string }> = {
  "/": { zh: "日语语法与词汇练习", en: "Japanese grammar & vocabulary practice" },
  "/login": { zh: "Google 登录", en: "Google sign-in" },
  "/android/link": { zh: "连接安卓应用", en: "Connect Android app" },
  "/onboarding": { zh: "建立学习计划", en: "Create your study plan" },
  "/today": { zh: "今日学习", en: "Today's learning" },
  "/grammar": { zh: "语法库", en: "Grammar library" },
  "/review": { zh: "复习队列", en: "Review queue" },
  "/history": { zh: "学习记录", en: "Learning history" },
  "/library": { zh: "词汇与表达库", en: "Vocabulary & expressions" },
  "/plans": { zh: "学习计划", en: "Study plans" },
  "/profile": { zh: "我的学习", en: "My learning" },
  "/membership": { zh: "会员与额度", en: "Membership & allowance" },
  "/membership/orders": { zh: "订单记录", en: "Orders" },
  "/membership/return": { zh: "付款状态", en: "Payment status" },
  "/about": { zh: "关于与联系", en: "About & contact" },
  "/privacy": { zh: "隐私说明", en: "Privacy" },
  "/study": { zh: "语法造句练习", en: "Grammar sentence practice" },
  "/vocabulary-learning": { zh: "词汇学习清单", en: "Vocabulary learning list" },
  "/vocabulary-practice": { zh: "词汇造句练习", en: "Vocabulary sentence practice" },
};
export function localizedDocumentTitle(pathname: string, locale: AppLocale) {
  const brand = brands[locale];
  const title = titles[pathname] ?? titles[`/${pathname.split("/")[1]}`];
  return title ? `${title[locale]} | ${brand}` : brand;
}

// Only the already-suppressed html language attribute changes before hydration.
// Text nodes stay identical between SSR and the first React render.
export const localeBootstrapScript = `try{var l=localStorage.getItem("jlpt-ui-locale");document.documentElement.lang=l==="en"?"en":"zh-CN"}catch(e){}`;
