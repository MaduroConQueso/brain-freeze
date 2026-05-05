import {
  createMemo,
  createOptimistic,
  For,
  Loading,
  type Component,
} from "solid-js";

import { getSearchHistory, HistoricalSearch, postSearch } from "../api/search";
import styles from "./SearchBar.module.css";
import { useSearchStore } from "../stores/SearchStore";
import { Dialog } from "./Dialog";
import { useSettingsStore } from "../stores/SettingsStore";
import { FilterDialog } from "./FilterDialog";

export const SearchBar: Component = () => {
  const { store: settings } = useSettingsStore();
  const { store, search: enqueueSearch } = useSearchStore();

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
  };

  return (
    <div class={styles.searchBar}>
      <form class={styles.searchForm} method="dialog" onSubmit={onSearch}>
        <input
          class={styles.search}
          type="search"
          name="search"
          placeholder="Search..."
          enterkeyhint="search"
          value={store.searchQuery}
        />
      </form>
      <div class={styles.moreRow}>
        <button
          class={styles.moreButton}
          command="show-modal"
          commandfor="history-dialog"
        >
          History
        </button>
        <button
          class={styles.moreButton}
          command="show-modal"
          commandfor="filter-dialog"
        >
          Filters
        </button>
      </div>

      <Dialog id="history-dialog">
        <Loading fallback={<pre>Loading...</pre>}>
          <SearchHistory
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

export const SearchHistory: Component<{ onHistory?: () => void }> = (props) => {
  const { store: settings } = useSettingsStore();
  const { restoreExistingSearch } = useSearchStore();

  const [searchHistory, _setOptimisticSearchHistory] = createOptimistic<
    HistoricalSearch[]
  >((prev = []) => {
    if (!settings.apiEndpoint) {
      return prev;
    }

    return getSearchHistory(settings.apiEndpoint);
  });

  const onClick = (search: HistoricalSearch) => {
    restoreExistingSearch(search.query, search.token);
    props.onHistory?.();
  };

  return (
    <ul class={styles.searchHistory}>
      <For each={searchHistory()}>
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
