import {
  Accessor,
  createContext,
  createMemo,
  createSignal,
  flush,
  isPending,
  onSettled,
  ParentComponent,
  useContext,
} from "solid-js";

import { postSearch } from "../services/api/search";
import {
  collateAllSearchResults,
  CollatedSearchResults,
  PrefilteredCollatedSearchResults,
  UserResponse,
} from "../services/collateAllSearchResults";
import {
  filterSearchResults,
  sortSearchResults,
} from "../services/filterSortSearchResults";
import { once } from "../utils/cancellableAsyncIterable";
import { FilterStoreContext } from "./FilterStore";
import { SettingsStoreContext } from "./SettingsStore";

export type SearchStore = {
  searchQuery: string;
  activeToken: number | undefined;
};

export type SearchStoreContextType = {
  searchQuery: Accessor<string>;
  searchResults: Accessor<CollatedSearchResults | undefined>;
  isStreamingResults: Accessor<boolean>;

  enqueueSearch: (searchQuery: string) => Promise<void>;
  restoreExistingSearch: (searchQuery: string, activeToken: number) => void;
};

export const SearchStoreContext = createContext<SearchStoreContextType>();
export const SearchStoreProvider: ParentComponent = (props) => {
  const { store: settings } = useContext(SettingsStoreContext);
  const { store: filters } = useContext(FilterStoreContext);

  const [searchQuery, setSearchQuery] = createSignal<string>("");
  const [activeToken, setActiveToken] = createSignal<number | undefined>();

  const searchResultsStream = createMemo<PrefilteredCollatedSearchResults>(
    () => {
      const token = activeToken();
      if (token === undefined) {
        return once({ responses: [], atLimit: true });
      }

      return collateAllSearchResults(token, settings.apiEndpoint);
    },
  );

  const isStreamingResults = createMemo<boolean>(() => {
    return (
      isPending(() => searchResultsStream()) ||
      searchResultsStream().atLimit === false
    );
  });

  const filteredSearchResults = createMemo<CollatedSearchResults | undefined>(
    (prev) => {
      const results = searchResultsStream();
      if (results === undefined) return prev;
      if (results.responses.length <= 0 && !results.atLimit) return prev;

      console.time("filterSearchResults");
      const prefilterFolderCount = results.responses.flatMap((response) =>
        Object.values(response.folders),
      ).length;
      const filtered: UserResponse[] = filterSearchResults(results, filters);
      const postfilterFolderCount = filtered.flatMap((response) =>
        Object.values(response.folders),
      ).length;
      console.timeEnd("filterSearchResults");

      return {
        ...results,
        responses: filtered,
        prefilterCount: prefilterFolderCount,
        postfilterCount: postfilterFolderCount,
      };
    },
  );

  const sortedSearchResults = createMemo<CollatedSearchResults | undefined>(
    (prev) => {
      let results = filteredSearchResults();
      if (results === undefined) return prev;

      console.time("sortedSearchResults");
      results = sortSearchResults(filters, results);
      console.timeEnd("sortedSearchResults");

      return results;
    },
  );

  const enqueueSearch = async function (query: string) {
    setSearchQuery(query);
    if (!settings.apiEndpoint) return;

    const postResults = await postSearch(settings.apiEndpoint, query);
    setActiveToken(postResults.token);
  };

  const restoreExistingSearch = (searchQuery: string, activeToken: number) => {
    setSearchQuery(searchQuery);
    flush();

    setActiveToken(activeToken);
  };

  // grab search from URL if given
  onSettled(() => {
    const defaultSearch = getDefaultSearch();
    if (defaultSearch) enqueueSearch(defaultSearch);
  });

  return (
    <SearchStoreContext
      value={{
        isStreamingResults,
        searchQuery,
        searchResults: sortedSearchResults,
        enqueueSearch,
        restoreExistingSearch,
      }}
    >
      {props.children}
    </SearchStoreContext>
  );
};

function getDefaultSearch() {
  const params = new URLSearchParams(location.search);
  const qSearch = params.get("q");

  const hash = location.hash;
  const hashParams = new URLSearchParams(hash);
  const hashQSearch = hashParams.get("q");

  return qSearch ?? hashQSearch ?? "";
}
