export type AndroidClientId = "android-release" | "android-test";
const surfaceKey = "jlpt-android-surface";
const handoffKey = "jlpt-android-handoff-v1";
const returnKey = "jlpt-android-login-return";
export const bindingIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A tab-scoped presentation hint, never authentication or entitlement evidence.
// Runs before AuthGate can redirect away from the TWA launch query.
export const androidSurfaceBootstrapScript = `try{var p=new URLSearchParams(location.search),c=p.get("client");if(p.get("platform")==="web"){sessionStorage.removeItem("${surfaceKey}");sessionStorage.removeItem("${handoffKey}")}else if(p.get("platform")==="android"){sessionStorage.setItem("${handoffKey}",p.get("nativeAuth")==="handoff-v1"?"1":"0");sessionStorage.setItem("${surfaceKey}",c==="android-test"?c:"android-release")}}catch(e){}`;

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

export function nativeHandoffAvailable(): boolean {
  try { return new URLSearchParams(window.location.search).get("nativeAuth") === "handoff-v1" || sessionStorage.getItem(handoffKey) === "1"; }
  catch { return false; }
}

export function nativeCommerceUrl(client: AndroidClientId, action: "membership" | "reward", ticket?: string) {
  const testPackage = process.env.NEXT_PUBLIC_ANDROID_TEST_PACKAGE === "com.meritledger.app"
    ? "com.meritledger.app" : "com.meritledger.app.debug";
  const packageName = client === "android-test" ? testPackage : "com.meritledger.app";
  if (ticket !== undefined && !/^[A-Za-z0-9_-]{43}$/.test(ticket)) throw new Error("Invalid handoff");
  return `intent://commerce?action=${action}${ticket ? `&handoff=${ticket}` : ""}#Intent;scheme=jlpt;package=${packageName};end`;
}

export function androidBindingPath(value: string | null): string | null {
  if (!value || value.includes("\\")) return null;
  if (/^\/membership(?:\/orders)?(?:\?|$)/.test(value)) {
    const page = new URL(value, "https://jlpt.invalid");
    if (page.hash || !["/membership", "/membership/orders"].includes(page.pathname)) return null;
    const keys = [...page.searchParams.keys()];
    if (new Set(keys).size !== keys.length || keys.some(key => !["platform", "client", "nativeAuth"].includes(key))) return null;
    if (page.searchParams.has("platform") && page.searchParams.get("platform") !== "android") return null;
    if (page.searchParams.has("client") && !["android-release", "android-test"].includes(page.searchParams.get("client")!)) return null;
    if (page.searchParams.has("nativeAuth") && page.searchParams.get("nativeAuth") !== "handoff-v1") return null;
    return page.pathname + page.search;
  }
  if (value.startsWith("/android/launch?")) {
    const launch = new URL(value, "https://jlpt.invalid");
    if (launch.hash || launch.searchParams.size !== 4 ||
      !["android-release", "android-test"].includes(launch.searchParams.get("client") ?? "") ||
      !["membership", "reward"].includes(launch.searchParams.get("action") ?? "") ||
      launch.searchParams.get("platform") !== "android" || launch.searchParams.get("nativeAuth") !== "handoff-v1") return null;
    return launch.pathname + launch.search;
  }
  if (!value.startsWith("/android/link?")) return null;
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
