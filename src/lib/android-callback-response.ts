// Android App Links intercept this path. The browser fallback never reflects the
// authorization code, loads application providers, or runs third-party scripts.
export function androidCallbackResponse() {
  return new Response('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>返回安卓应用 | Return to Android</title><body><main><h1>请返回安卓应用</h1><p>若应用未自动打开，请回到应用重新连接。</p><h2 lang="en">Return to the Android app</h2><p lang="en">If the app did not open, return to it and start connecting again.</p></main></body></html>', {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
