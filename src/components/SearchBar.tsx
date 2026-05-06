import {
  createOptimistic,
  For,
  Loading,
  refresh,
  Show,
  useContext,
  type Component
} from "solid-js";

import { getSearchHistory, HistoricalSearch } from "../api/search";
import { SearchStoreContext } from "../stores/SearchStore";
import { SettingsStoreContext } from "../stores/SettingsStore";
import { Dialog } from "./Dialog";
import { FilterDialog } from "./FilterDialog";

import styles from "./SearchBar.module.css";

export const SearchBar: Component = () => {
  const { searchQuery, searchResults, enqueueSearch, isStreamingResults } =
    useContext(SearchStoreContext);

  const { store: settings } = useContext(SettingsStoreContext);
  const [searchHistory] = createOptimistic<
    HistoricalSearch[]
  >((prev = []) => {
    if (!settings.apiEndpoint) {
      return prev;
    }

    return getSearchHistory(settings.apiEndpoint);
  });

  const onSearch = async (evt: SubmitEvent) => {
    evt.preventDefault();
    (document.activeElement as HTMLElement)?.blur();

    const form = evt.target as HTMLFormElement;
    const search = form.elements.namedItem("search") as
      | HTMLInputElement
      | undefined;

    const searchQuery = search?.value?.trim();
    if (!searchQuery) {
      return;
    }

    await enqueueSearch(searchQuery);
    refresh(searchHistory);
  };

  return (
    <div class={[styles.searchBar, isStreamingResults() && styles.pendingGlow]}>
      <form class={styles.searchForm} method="dialog" onSubmit={onSearch}>
        <input
          class={styles.search}
          type="search"
          name="search"
          placeholder="Search..."
          enterkeyhint="search"
          value={searchQuery()}
        />
      </form>
      <div class={styles.moreRow}>
        <button
          class={styles.moreButton}
          command="show-modal"
          commandfor="history-dialog"
        >
          {isStreamingResults() ? "PENDING" : "History"}
        </button>
        <button
          class={styles.moreButton}
          command="show-modal"
          commandfor="filter-dialog"
        >
          <span>Filters</span>
          <Loading>
            <Show when={searchResults()?.postfilterCount !== searchResults()?.prefilterCount}>
              <strong class={styles.filterCount}>&nbsp;({searchResults()?.postfilterCount}/{searchResults()?.prefilterCount})</strong>
            </Show>
          </Loading>
        </button>
      </div>

      <Dialog id="history-dialog">
        <Loading fallback={<pre>Loading...</pre>}>
          <SearchHistory
            searchHistory={searchHistory()}
            onHistory={() => {
              (
                document.getElementById(
                  "history-dialog",
                ) as HTMLDialogElement | null
              )?.close();
            }}
          />
        </Loading>
      </Dialog>

      <FilterDialog id="filter-dialog" />
    </div>
  );
};

export const SearchHistory: Component<{ searchHistory: HistoricalSearch[]; onHistory?: () => void }> = (props) => {
  const { restoreExistingSearch } = useContext(SearchStoreContext);

  const onClick = (search: HistoricalSearch) => {
    restoreExistingSearch(search.query, search.token);
    props.onHistory?.();
  };

  return (
    <ul class={styles.searchHistory}>
      <For each={props.searchHistory}>
        {(search) => (
          <li class={styles.searchHistoryLine}>
            <a href="#" onClick={() => onClick(search())}>
              {search().query} <em>{search().result_count} finds</em>
            </a>
          </li>
        )}
      </For>
    </ul>
  );
};
