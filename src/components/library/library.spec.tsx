import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/client";
import { Library } from "./library";

vi.mock("@/lib/api/client", async original => ({ ...await original<typeof import("@/lib/api/client")>(), apiRequest: vi.fn() }));
vi.mock("./word-card", () => ({ WordCard: ({ word }: { word: { word: string } }) => <h3>{word.word}</h3> }));
vi.mock("./import-manager", () => ({ ImportManager: () => <div>JSON importer</div> }));
const requests: URL[] = [];
beforeEach(() => {
  requests.length = 0;
  vi.mocked(apiRequest).mockImplementation(async path => {
    const url = new URL(path, "https://test.local"); requests.push(url);
    if (url.pathname === "/expressions") return { data: [], meta: {} };
    const page = url.searchParams.has("cursor") ? 2 : 1;
    return { data: [{ id: `${page}`, word: `${url.searchParams.get("level")}-${url.searchParams.get("list") ?? "browse"}-${page}` }], meta: { nextCursor: page === 1 ? "second" : null } };
  });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function renderLibrary() {
  render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}><Library /></SWRConfig>);
}
function filters() { return within(screen.getByRole("navigation", { name: "词汇筛选" })); }

it("orders levels, search and filters; preserves search and resets loaded pages when filters change", async () => {
  renderLibrary();
  const levels = screen.getByRole("group", { name: "词汇参考级别" });
  expect(within(levels).getAllByRole("button").map(button => button.textContent)).toEqual(["N1", "N2", "N3", "N4"]);
  expect(screen.queryByRole("button", { name: "词汇查询" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "全部" })).not.toBeInTheDocument();
  await screen.findByText("N1-browse-1");
  fireEvent.click(screen.getByRole("button", { name: "加载更多" }));
  await screen.findByText("N1-browse-2");
  fireEvent.click(filters().getByRole("button", { name: "根本不会" }));
  await screen.findByText("N1-UNKNOWN-1");
  fireEvent.click(filters().getByRole("button", { name: "根本不会" }));
  await screen.findByText("N1-browse-1");
  await waitFor(() => expect(screen.queryByText("N1-browse-2")).not.toBeInTheDocument());
  fireEvent.change(screen.getByLabelText("搜索词汇"), { target: { value: "予定" } });
  await waitFor(() => expect(requests.at(-1)?.searchParams.get("query")).toBe("予定"));
  expect(screen.queryByText("N1-browse-2")).not.toBeInTheDocument();
  fireEvent.click(filters().getByRole("button", { name: "根本不会" }));
  await screen.findByText("N1-UNKNOWN-1");
  fireEvent.click(within(levels).getByRole("button", { name: "N2" }));
  await screen.findByText("N2-UNKNOWN-1");
  expect(screen.getByLabelText("搜索词汇")).toHaveValue("予定");
  expect(requests.at(-1)?.searchParams.get("cursor")).toBeNull();
  fireEvent.click(filters().getByRole("button", { name: "根本不会" }));
  await screen.findByText("N2-browse-1");
  expect(filters().getByRole("button", { name: "根本不会" })).toHaveAttribute("aria-pressed", "false");
});

it("routes each list and bookmarks with level and search and restores state after more panels", async () => {
  renderLibrary();
  await screen.findByText("N1-browse-1");
  fireEvent.change(screen.getByLabelText("搜索词汇"), { target: { value: "会議" } });
  fireEvent.click(screen.getByRole("button", { name: "N3" }));
  for (const [label, value] of [["想熟练", "PRACTICE"], ["已记住", "REMEMBERED"], ["词汇学习清单", "DUE"]]) {
    fireEvent.click(filters().getByRole("button", { name: label }));
    await screen.findByText(`N3-${value}-1`);
    expect(requests.at(-1)?.pathname).toBe("/vocabulary-learning");
    expect(requests.at(-1)?.searchParams.get("query")).toBe("会議");
  }
  expect(screen.getByRole("heading", { name: "今日待复习" })).toBeInTheDocument();
  expect(screen.queryByLabelText("搜索学习词汇")).not.toBeInTheDocument();
  fireEvent.click(filters().getByRole("button", { name: "生词收藏" }));
  await waitFor(() => expect(requests.at(-1)?.pathname).toBe("/vocabulary/bookmarks"));
  expect(requests.at(-1)?.searchParams.get("level")).toBe("N3");
  expect(requests.at(-1)?.searchParams.get("query")).toBe("会議");
  fireEvent.click(filters().getByRole("button", { name: "更多" }));
  fireEvent.click(screen.getByRole("button", { name: "我的表达" }));
  await screen.findByText("还没有收藏的表达");
  expect(screen.queryByLabelText("搜索词汇")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "返回词汇库" }));
  expect(screen.getByLabelText("搜索词汇")).toHaveValue("会議");
  expect(screen.getByRole("button", { name: "N3" })).toHaveAttribute("aria-pressed", "true");
  expect(filters().getByRole("button", { name: "生词收藏" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(filters().getByRole("button", { name: "更多" }));
  fireEvent.click(screen.getByRole("button", { name: "私人资料导入" }));
  expect(screen.getByText("JSON importer")).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "词汇筛选" })).not.toBeInTheDocument();
});

it("shows a retryable error and then an empty result", async () => {
  vi.mocked(apiRequest).mockRejectedValueOnce(new Error("加载失败"));
  renderLibrary();
  expect(await screen.findByRole("alert")).toHaveTextContent("加载失败");
  vi.mocked(apiRequest).mockResolvedValue({ data: [], meta: {} });
  fireEvent.click(screen.getByRole("button", { name: "重试" }));
  expect(await screen.findByText("没有匹配的词汇")).toBeInTheDocument();
});
