import { beforeEach, describe, expect, it } from "vitest";
import { androidBindingPath, androidClient, androidSurfaceBootstrapScript, consumeAndroidLogin, nativeCommerceUrl, rememberAndroidLogin, validatedAndroidCallback } from "./android-commerce";
import { androidCallbackResponse } from "./android-callback-response";

const path = "/android/link?bindingId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
beforeEach(() => { sessionStorage.clear(); window.history.replaceState(null, "", "/"); });
describe("Android browser handoff boundaries", () => {
  it("captures the tab hint before a login redirect and keeps ordinary tabs on web", () => {
    expect(androidClient()).toBeNull();
    window.history.replaceState(null, "", "/today?platform=android&client=android-test");
    window.eval(androidSurfaceBootstrapScript);
    window.history.replaceState(null, "", "/login");
    expect(androidClient()).toBe("android-test");
    sessionStorage.clear();
    expect(androidClient()).toBeNull();
  });
  it("uses fixed native actions and package names without caller URLs", () => {
    expect(nativeCommerceUrl("android-release", "membership")).toBe("intent://commerce?action=membership#Intent;scheme=jlpt;package=com.meritledger.app;end");
    expect(nativeCommerceUrl("android-test", "reward")).toBe("intent://commerce?action=reward#Intent;scheme=jlpt;package=com.meritledger.app.debug;end");
  });
  it.each(["//evil.example", "/\\evil.example", path + "&returnTo=https://evil.example", path + "#secret", path + "&bindingId=other", "/android/link?bindingId=nope"])("rejects unsafe login return %s", value => {
    expect(androidBindingPath(value)).toBeNull();
    rememberAndroidLogin(value); expect(consumeAndroidLogin()).toBeNull();
  });
  it("consumes a bounded login return only once and expires it", () => {
    rememberAndroidLogin(path, 1000);
    expect(consumeAndroidLogin(2000)).toBe(path);
    expect(consumeAndroidLogin(2000)).toBeNull();
    rememberAndroidLogin(path, 1000);
    expect(consumeAndroidLogin(601001)).toBeNull();
  });
  it("rejects a callback for another origin, client, credentials or extra parameters", () => {
    const origin = "https://jlpt.meritledger.org";
    const query = `?code=${"c".repeat(43)}&state=${"s".repeat(43)}`;
    const url = origin + "/android/callback" + query;
    expect(validatedAndroidCallback(url, "android-release", origin)).toBe(url);
    for (const invalid of [url.replace(origin, "https://evil.example"), url.replace("/callback?", "/callback/test?"), url + "&token=secret", url + "#fragment", url.replace("https://", "https://user@"), origin + "/today" + query]) {
      expect(() => validatedAndroidCallback(invalid, "android-release", origin)).toThrow();
    }
  });
  it("provides a code-free no-store no-referrer fallback with no scripts", async () => {
    const response = androidCallbackResponse();
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'none'");
    const html = await response.text();
    expect(html).not.toMatch(/<script|code=|state=|accessToken|https?:\/\//);
  });
});
