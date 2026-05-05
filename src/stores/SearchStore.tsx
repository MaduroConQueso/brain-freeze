import {
  Accessor,
  createContext,
  createEffect,
  createMemo,
  createStore,
  onSettled,
  ParentComponent,
  refresh,
  Store,
  useContext,
} from "solid-js";
import { getSearchResults, postSearch, SearchItem } from "../api/search";
import { useSettingsStore } from "./SettingsStore";
import { FileType, FilterStoreContext } from "./FilterStore";

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

  // grab search from URL if given
  onSettled(() => {
    const defaultSearch = getDefaultSearch();
    if (defaultSearch) search(defaultSearch);
  });

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
  const { store: filters } = useContext(FilterStoreContext);

  const [store, setStore] = createStore({
    searchQuery: "",
    activeToken: undefined as number | undefined,
  });

  const searchResults = createMemo<CollatedSearchResults | undefined>(
    async (prev) => {
      if (store.activeToken === undefined) return prev;

      const results = await collateSearchResults(
        store.activeToken,
        settings.apiEndpoint,
      );

      return results;
    },
  );

  const filteredSearchResults = createMemo<CollatedSearchResults | undefined>(
    (prev) => {
      const results = searchResults();
      if (results === undefined) return prev;

      const filterString = filters.filterString?.toLowerCase();

      const filtered: UserResponse[] = [];
      for (const item of results.responses) {
        if (filters.hidePrivate && item.isPrivate) continue;
        if (filters.hideQueue && item.queuePosition > 0) continue;

        const filteredItemFolders: Record<string, UserFile[]> = {};
        for (const [folderName, folder] of Object.entries(item.folders)) {
          const filteredFolder: UserFile[] = [];
          for (const file of folder) {
            if (
              filterString &&
              !file.fullPath.toLowerCase().includes(filterString)
            )
              continue;
            if (!matchesCategory(file, filters.fileType)) continue;
            if (
              filters.minQuality.trim() &&
              !hasMinimumQuality(file, filters.minQuality)
            )
              continue;

            filteredFolder.push(file);
          }

          if (
            filters.minFilesInFolder > filteredFolder.length ||
            filteredFolder.length <= 0
          )
            continue;
          filteredItemFolders[folderName] = filteredFolder;
        }

        if (Object.keys(filteredItemFolders).length === 0) continue;
        filtered.push({ ...item, folders: filteredItemFolders });
      }

      return {
        ...results,
        responses: filtered,
      };
    },
  );

  const sortedSearchResults = createMemo<CollatedSearchResults | undefined>(
    (prev) => {
      const results = filteredSearchResults();
      if (results === undefined) return prev;

      if (filters.sort === "relevancy") {
        const sorted = results.responses;

        return {
          ...results,
          responses:
            filters.sortDirection === "asc" ? sorted.toReversed() : sorted,
        };
      }

      if (filters.sort === "smartStort") {
        const sortDirection = filters.sortDirection === "asc" ? -1 : 1;
        const sorted = results.responses.toSorted((a, b) => {
          const aScore = smartScore(a);
          const bScore = smartScore(b);
          return (bScore - aScore) * sortDirection;
        });

        return {
          ...results,
          responses: sorted,
        };
      }

      if (filters.sort === "quality") {
        const sortDirection = filters.sortDirection === "asc" ? -1 : 1;
        const sorted = results.responses.toSorted((a, b) => {
          const aScore = scoreResponseByQuality(a);
          const bScore = scoreResponseByQuality(b);
          return (bScore - aScore) * sortDirection;
        });

        return {
          ...results,
          responses: sorted,
        };
      }

      if (filters.sort === "downloadSpeed") {
        const sortDirection = filters.sortDirection === "asc" ? -1 : 1;
        const sorted = results.responses.toSorted((a, b) => {
          const aScore = a.uploadSpeed;
          const bScore = b.uploadSpeed;
          return (bScore - aScore) * sortDirection;
        });

        return {
          ...results,
          responses: sorted,
        };
      }

      return results;
    },
  );

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

  return {
    store,
    searchResults: sortedSearchResults,
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
  apiEndpoint: string,
  limit: number = 1500,
): Promise<CollatedSearchResults> {
  const results = await getSearchResults(apiEndpoint, { token, limit });

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

function scoreResponseByQuality(response: UserResponse): number {
  const tracks = Object.values(response.folders).flatMap((folder) => folder);
  return (
    tracks.reduce((acc, file) => acc + scoreFileByQuality(file), 0) /
    (1.0 * tracks.length)
  );
}

function scoreFileByQuality(file: UserFile): number {
  const category = categorizeFile(file);
  if (category === "all") return 0;

  if (category === "lossy") {
    const bitrate = (file.attributes[0] || 0) / 1000.0;
    // scale bitrate to 0-5 range, with 5 being highest quality
    // anything above 5 (5 * 64 = 320kbps) is capped at 5
    return Math.min(5, bitrate / 64.0);
  }

  if (category === "lossless") {
    const samplerate = file.attributes[4] || 0;
    const bitDepth = file.attributes[5] || 0;
    // scale samplerate from 44100-96000 to 0-2 range
    // scale bitdepth from 8-24 to 0-3
    // lossless has a base score of 5, and samplerate/bitdepth are added on top
    return Math.max(
      5,
      5 +
        Math.min(2, (samplerate - 44100) / 25950.0) +
        Math.min(3, bitDepth / 8.0),
    );
  }

  return 0;
}

function hasMinimumQuality(file: UserFile, qualityString: string): boolean {
  const category = categorizeFile(file);
  if (category === "all") return false;

  if (category === "lossy") {
    return (file.attributes[0] || 0) >= Number(qualityString.trim());
  }

  if (category === "lossless") {
    const samplerate = file.attributes[4] || 0;
    const bitDepth = file.attributes[5] || 0;
    const [qBitDepth, qSampleRate] = qualityString
      .trim()
      .split("/")
      .map(Number);
    return bitDepth >= qBitDepth && samplerate >= qSampleRate;
  }

  return false;
}

function matchesCategory(file: UserFile, category: FileType): boolean {
  if (category === "all") return true;

  const fileCategory = categorizeFile(file);
  if (
    category === "audio" &&
    (fileCategory === "lossy" || fileCategory === "lossless")
  )
    return true;
  return category === fileCategory;
}

const lossy = new Set(["mp3", "m4a", "opus", "ogg"]);
const lossless = new Set(["flac", "alac", "wav", "aiff"]);
function categorizeFile(file: UserFile): FileType {
  const ext = file.fileName.split(".").pop()?.toLowerCase();

  if (ext && lossy.has(ext)) return "lossy";
  if (ext && lossless.has(ext)) return "lossless";
  return "all";
}

function getDefaultSearch() {
  const params = new URLSearchParams(location.search);
  const qSearch = params.get("q");

  const hash = location.hash;
  const hashParams = new URLSearchParams(hash);
  const hashQSearch = hashParams.get("q");

  return qSearch ?? hashQSearch ?? "";
}
