export type AndroidClientId = "android-release" | "android-test";
const surfaceKey = "jlpt-android-surface";
const returnKey = "jlpt-android-login-return";
export const bindingIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A tab-scoped presentation hint, never authentication or entitlement evidence.
// Runs before AuthGate can redirect away from the TWA launch query.
export const androidSurfaceBootstrapScript = `try{var p=new URLSearchParams(location.search),c=p.get("client");if(p.get("platform")==="web"){sessionStorage.removeItem("${surfaceKey}")}else if(p.get("platform")==="android"){sessionStorage.setItem("${surfaceKey}",c==="android-test"?c:"android-release")}}catch(e){}`;

export function androidClient(): AndroidClientId | null {
  const query = new URLSearchParams(window.location.search);
  if (query.get("platform") === "web") return null;
  let saved: string | null = null;
  try { saved = sessionStorage.getItem(surfaceKey); } catch {}
  if (query.get("platform") === "android") return query.get("client") === "android-test" ? "android-test" : "android-release";
  if (saved === "android-test" || saved === "android-release") return saved;
  // Compatibility with previously launched tabs; still only hides Stripe UI.
  if (saved === "1" || /^android-app:\/\/com\.meritledger\.app(?:\/|$)/.test(document.referrer)) return "android-release";
  return null;
}

export function nativeCommerceUrl(client: AndroidClientId, action: "membership" | "reward") {
  const packageName = client === "android-test" ? "com.meritledger.app.debug" : "com.meritledger.app";
  return `intent://commerce?action=${action}#Intent;scheme=jlpt;package=${packageName};end`;
}

export function androidBindingPath(value: string | null): string | null {
  if (!value || !value.startsWith("/android/link?") || value.includes("\\")) return null;
  const url = new URL(value, "https://jlpt.invalid");
  const id = url.searchParams.get("bindingId");
  if (url.pathname !== "/android/link" || url.hash || url.searchParams.size !== 1 || !id || !bindingIdPattern.test(id)) return null;
  return `/android/link?bindingId=${id}`;
}

export function rememberAndroidLogin(value: string | null, now = Date.now()) {
  try {
    sessionStorage.removeItem(returnKey);
    const path = androidBindingPath(value);
    if (path) sessionStorage.setItem(returnKey, JSON.stringify({ path, expiresAt: now + 10 * 60_000 }));
  } catch {}
}

export function consumeAndroidLogin(now = Date.now()): string | null {
  try {
    const raw = sessionStorage.getItem(returnKey);
    sessionStorage.removeItem(returnKey);
    if (!raw) return null;
    const value = JSON.parse(raw) as { path: string; expiresAt: number };
    return Number.isFinite(value.expiresAt) && value.expiresAt > now && value.expiresAt <= now + 10 * 60_000 ? androidBindingPath(value.path) : null;
  } catch { return null; }
}

export function validatedAndroidCallback(value: string, client: AndroidClientId, origin: string): string {
  const url = new URL(value);
  const expectedPath = client === "android-test" ? "/android/callback/test" : "/android/callback";
  if (url.origin !== origin || url.username || url.password || url.hash || url.pathname !== expectedPath || url.searchParams.size !== 2 ||
      !/^[A-Za-z0-9_-]{32,128}$/.test(url.searchParams.get("code") ?? "") ||
      !/^[A-Za-z0-9_-]{32,128}$/.test(url.searchParams.get("state") ?? "")) throw new Error("Invalid Android callback");
  return url.href;
}
