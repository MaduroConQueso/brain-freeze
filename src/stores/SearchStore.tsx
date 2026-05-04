import {
  Accessor,
  createContext,
  createEffect,
  createMemo,
  createStore,
  latest,
  ParentComponent,
  refresh,
  Store,
  useContext,
} from "solid-js";
import { getSearchResults, postSearch, SearchItem } from "../api/search";
import { useSettingsStore } from "./SettingsStore";

export type SearchStore = {
  searchQuery: string;
  activeToken: number | undefined;
};

export type SearchStoreContextType = {
  store: Store<SearchStore>;
  searchResults: Accessor<CollatedSearchResults | undefined>;

  search: (searchQuery: string) => Promise<void>;
  restoreExistingSearch: (searchQuery: string, activeToken: number) => void;
};

export const SearchStoreContext = createContext<SearchStoreContextType>();
export const SearchStoreProvider: ParentComponent = (props) => {
  const { store, search, searchResults, restoreExistingSearch } =
    createSearchStore();
  return (
    <SearchStoreContext
      value={{ store, search, searchResults, restoreExistingSearch }}
    >
      {props.children}
    </SearchStoreContext>
  );
};

export const useSearchStore = () => {
  return useContext(SearchStoreContext);
};

function createSearchStore() {
  const { store: settings } = useSettingsStore();

  const [store, setStore] = createStore({
    searchQuery: "",
    activeToken: undefined as number | undefined,
  });

  const searchResults = createMemo<CollatedSearchResults | undefined>(
    (prev) => {
      if (store.activeToken === undefined) return prev;
      return collateSearchResults(store.activeToken);
    },
  );

  const search = async (searchQuery: string) => {
    setStore((draft) => {
      draft.searchQuery = searchQuery;
    });

    if (!settings.apiEndpoint) return;

    const queuedSearch = await postSearch(settings.apiEndpoint, searchQuery);
    setStore((draft) => {
      draft.activeToken = queuedSearch.token;
    });
  };

  const restoreExistingSearch = (searchQuery: string, activeToken: number) => {
    setStore((draft) => {
      draft.searchQuery = searchQuery;
      draft.activeToken = activeToken;
    });
  };

  createEffect(
    () => [store.activeToken, searchResults] as const,
    ([token, results]) => {
      if (token === undefined) return;

      let refreshCount = 0;
      const timer = setInterval(() => {
        refreshCount++;
        if (refreshCount >= 10) {
          return clearInterval(timer);
        }

        if (results()?.atLimit) {
          return clearInterval(timer);
        }

        refresh(results);
      }, 1000);

      return () => clearInterval(timer);
    },
  );

  return {
    store,
    searchResults,
    search,
    restoreExistingSearch,
  };
}

export type CollatedSearchResults = {
  atLimit: boolean;
  responses: UserResponse[];
};

export type UserResponse = {
  username: string;
  isPrivate: boolean;
  freeUploadSlots: boolean;
  queuePosition: number;
  uploadSpeed: number;

  folders: Record<string, UserFile[]>;
};

export type UserFile = {
  folderName: string;
  fileName: string;
  extension: string;
  /**
   * - 0: lossy compression kbps
   * - 1: duration in seconds
   * - 2: ??? have only seen as '0'
   * - 3: n/a
   * - 4: lossless sampling rate (eg 44100)
   * - 5: lossless bit depth (eg 16)
   */
  attributes: Record<string, number>;
  fullPath: string;
};

async function collateSearchResults(
  token: number,
  limit: number = 1500,
): Promise<CollatedSearchResults> {
  const { store: settings } = useSettingsStore();
  const results = await getSearchResults(
    latest(() => settings.apiEndpoint),
    { token, limit },
  );

  // might be overwrought
  // I believe ES2015 now preserves insertion order for objects
  const usernameIndexLookup: Record<string, number> = {};
  const userResponses: UserResponse[] = [];

  const getOrMakeUser = (item: SearchItem): UserResponse => {
    if (usernameIndexLookup[item.username] !== undefined) {
      return userResponses[usernameIndexLookup[item.username]];
    } else {
      const userResponse: UserResponse = {
        username: item.username,
        isPrivate: item.is_private,
        freeUploadSlots: item.free_upload_slots,
        queuePosition: item.queue_position,
        uploadSpeed: item.upload_speed,
        folders: {},
      };

      usernameIndexLookup[userResponse.username] = userResponses.length;
      userResponses.push(userResponse);

      return userResponse;
    }
  };

  for (const item of results.items) {
    const userResponse = getOrMakeUser(item);

    const [folderName, fileName] = getFolderAndFileName(item.file_path);
    const folder: UserFile[] = userResponse.folders[folderName] ?? [];
    folder.push({
      folderName,
      fileName,
      extension: item.extension,
      attributes: item.file_attributes,
      fullPath: item.file_path,
    });

    userResponse.folders[folderName] = folder;
  }

  if (latest(() => settings.smartSort)) {
    userResponses.sort((a, b) => {
      const aScore = smartScore(a);
      const bScore = smartScore(b);
      return bScore - aScore;
    });
  }

  const wasAgo = Math.abs(Date.now() - results.created_at * 1000) > 120_000; // milliseconds
  const atLimit =
    // if the server says there's no more results
    // and it's been more than two minutes since we last asked
    // we're at the limit
    (wasAgo && results.count >= results.total) ||
    // if we hit the search limit, we're at the limit
    results.count >= results.limit;

  return {
    atLimit,
    responses: userResponses,
  };
}

function getFolderAndFileName(path: string): [string, string] {
  const split = path.split(/[/\\]/);
  if (split.length < 2) {
    return ["", split[0] || path];
  } else {
    return [split[split.length - 2], split[split.length - 1]];
  }
}

function smartScore(response: UserResponse): number {
  let baseScore = 0;

  // privates are no-go
  if (response.isPrivate) {
    baseScore -= 1000;
  }

  // queue position is inversely proportional to score
  // but log scale means once you're in line, being in line a lot is not much worse
  baseScore -= Math.log(response.queuePosition + 1) * 5;

  let fileCount = 0;
  let preferredFormatTotal = 0;
  let preferredQualityTotal = 0;
  for (const file of Object.values(response.folders).flatMap(
    (folder) => folder,
  )) {
    fileCount += 1;
    if (file.fileName.endsWith(".mp3") || file.fileName.endsWith(".flac")) {
      preferredFormatTotal += 1;
    }

    if (
      (file.attributes[0] || 0) >= 320 ||
      (file.attributes[4] || 0) >= 44100 ||
      (file.attributes[5] || 0) >= 16
    ) {
      preferredQualityTotal += 1;
    }
  }

  // if we're at least 320 mp3s or 16/44100 flacs on average, that helps
  baseScore += ((1.0 * preferredFormatTotal) / fileCount) * 3;
  baseScore += ((1.0 * preferredQualityTotal) / fileCount) * 2;

  // weigh faster connections higher, but again logarithmically
  baseScore += Math.log(response.uploadSpeed / 1_000_000 + 1.0) * 10;
  return baseScore;
}
