import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { apiFetcher, apiRequest } from "@/lib/api/client";
import { setLocale } from "@/lib/i18n/locale-store";
import { AndroidLinkPage } from "./android-link-page";

const state = vi.hoisted(() => ({ query: "bindingId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(state.query) }));
vi.mock("@/hooks/use-api", () => ({ useMe: () => ({ data: { id: "u1", displayName: "Learner", email: "learner@example.test" } }) }));
vi.mock("@/components/locale/language-picker", () => ({ LanguagePicker: () => null }));
vi.mock("@/lib/api/client", async original => ({ ...await original<typeof import("@/lib/api/client")>(), apiFetcher: vi.fn(), apiRequest: vi.fn() }));
function mount() { render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><AndroidLinkPage /></SWRConfig>); }
beforeEach(() => {
  vi.clearAllMocks(); act(() => setLocale("zh"));
  state.query = "bindingId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  vi.mocked(apiFetcher).mockResolvedValue({ clientId: "android-test", expiresAt: new Date(Date.now() + 600000).toISOString(), scopes: ["commerce:read"] });
});
afterEach(cleanup);
it("shows the account and requires a click; rejects an unsafe callback without displaying code", async () => {
  vi.mocked(apiRequest).mockResolvedValue({ data: { callbackUrl: "https://evil.example/android/callback?code=secret&state=secret" } });
  mount();
  const button = await screen.findByRole("button", { name: "确认并返回安卓应用" });
  expect(screen.getByText("learner@example.test")).toBeInTheDocument();
  expect(apiRequest).not.toHaveBeenCalled();
  fireEvent.click(button);
  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith("/android/auth/bindings/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/approve", { method: "POST", body: "{}" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("连接未完成");
  expect(document.body.textContent).not.toMatch(/secret|evil.example/);
});
it("does not approve an expired binding and localizes the title", async () => {
  vi.mocked(apiFetcher).mockResolvedValue({ clientId: "android-test", expiresAt: "2000-01-01T00:00:00Z", scopes: [] });
  mount(); await screen.findByRole("alert");
  expect(screen.queryByRole("button", { name: "确认并返回安卓应用" })).not.toBeInTheDocument();
  act(() => setLocale("en"));
  expect(screen.getByText("Connect Android app")).toBeInTheDocument();
  expect(apiRequest).not.toHaveBeenCalled();
});
it("does not fetch malformed or duplicate bindings", async () => {
  state.query += "&bindingId=other"; mount();
  expect(await screen.findByRole("alert")).toHaveTextContent("连接链接无效");
  expect(apiFetcher).not.toHaveBeenCalled(); expect(apiRequest).not.toHaveBeenCalled();
});
