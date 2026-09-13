import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { rememberAndroidLogin } from "@/lib/android-commerce";
import { setLocale } from "@/lib/i18n/locale-store";
import { LoginView } from "./login-view";

const state = vi.hoisted(() => ({ query: "login=success", replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: state.replace }), useSearchParams: () => new URLSearchParams(state.query) }));
vi.mock("@/hooks/use-api", () => ({ useMe: () => ({ data: { id: "qa" } }), usePlans: () => ({ data: { items: [] } }) }));
vi.mock("@/components/locale/language-picker", () => ({ LanguagePicker: () => null }));
vi.mock("@/components/theme/theme-picker", () => ({ ThemePicker: () => null }));
const path = "/android/link?bindingId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); state.query = "login=success"; act(() => setLocale("zh")); });
afterEach(cleanup);
it("returns from the actual /login?login=success OAuth landing before onboarding can win", async () => {
  rememberAndroidLogin(path);
  const view = render(<LoginView />);
  await waitFor(() => expect(state.replace).toHaveBeenCalledWith(path));
  view.rerender(<LoginView />);
  expect(state.replace).not.toHaveBeenCalledWith("/onboarding");
});
it("allows an already signed-in user to connect before creating a study plan", async () => {
  state.query = `next=${encodeURIComponent(path)}`; render(<LoginView />);
  await waitFor(() => expect(state.replace).toHaveBeenCalledWith(path));
  expect(state.replace).not.toHaveBeenCalledWith("/onboarding");
});
it("retains ordinary onboarding when no Android return is pending", async () => {
  render(<LoginView />);
  await waitFor(() => expect(state.replace).toHaveBeenCalledWith("/onboarding"));
});
