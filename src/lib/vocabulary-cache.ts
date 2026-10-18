import type { Cache, ScopedMutator } from "swr";
import { unstable_serialize } from "swr/infinite";

/** Drop cached pages as well as their infinite-list snapshots before refreshing.
 * Inactive filters must not restore a stale second page after a state change. */
export async function refreshVocabularyLists(
  cache: Cache,
  mutate: ScopedMutator,
  refresh: () => Promise<unknown>,
) {
  const pages = [...cache.keys()].filter(key =>
    /^\/vocabulary(?:\?|\/bookmarks\?)|^\/vocabulary-learning\?/.test(key),
  );
  const lists = pages.filter(key => !new URLSearchParams(key.split("?")[1]).has("cursor"))
    .map(key => unstable_serialize(() => key));
  await Promise.all(pages
    .map(key => mutate(key, undefined, { revalidate: false })));
  // Revalidation also expires SWR's deduplicated requests for inactive filters.
  // Otherwise returning quickly can reuse an old request after its data was cleared.
  await Promise.all([...new Set(lists)]
    .map(key => mutate(key, undefined, { revalidate: true })));
  if (!lists.length) await refresh();
}
