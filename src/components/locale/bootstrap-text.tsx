import { translate } from "@/lib/i18n/locale-store";

/** Both strings are SSR-stable; CSS chooses the saved language before hydration. */
export function BootstrapText({ source, untranslatedFallback }: { source: string; untranslatedFallback?: string }) {
  const translated = translate(source, "en");
  const english = untranslatedFallback && translated === source && /[\u4e00-\u9fff]/.test(source) && !/[\u3040-\u30ff]/.test(source) ? untranslatedFallback : translated;
  return <><span data-bootstrap-locale="zh" lang="zh-CN">{source}</span><span data-bootstrap-locale="en" lang="en">{english}</span></>;
}
