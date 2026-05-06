import {
  createContext,
  createEffect,
  createProjection,
  createStore,
  deep,
  ParentComponent,
  snapshot,
} from "solid-js";

import { StoreObject } from "../utils/types";

export type FilterStore = {
  sort: Sort;
  sortDirection: SortDirection;
  filterString: string;
  fileType: FileType;
  minQuality: string;
  minFilesInFolder: number;
  hideQueue: boolean;
  hidePrivate: boolean;
};

export const sortMap = {
  relevancy: "Relevancy (default)",
  smartStort: "Smart sort",
  quality: "Quality",
  downloadSpeed: "Download speed",
} as const;
export type Sort = keyof typeof sortMap;

export const sortDirectionMap = {
  asc: "Ascending",
  desc: "Descending",
} as const;
export type SortDirection = keyof typeof sortDirectionMap;

export const fileTypeMap = {
  all: "All",
  audio: "All audio files",
  lossless: "Lossless (FLAC, ALAC, WAV, etc)",
  lossy: "Lossy (MP3, AAC, etc)",
} as const;
export type FileType = keyof typeof fileTypeMap;

export type FilterStoreContextType = StoreObject<FilterStore>;
export const FilterStoreContext = createContext<FilterStoreContextType>();

export const FilterStoreProvider: ParentComponent = (props) => {
  const [store, setStore] = createStore<FilterStore>(
    JSON.parse(localStorage.getItem("filters") ?? "null") ?? {
      sort: "relevancy",
      sortDirection: "desc",
      filterString: "",
      fileType: "all",
      minQuality: "",
      minFilesInFolder: 0,
      hideQueue: false,
      hidePrivate: false,
    },
  );

  const trimmedStore = createProjection(
    (draft: FilterStore) => {
      draft.filterString = draft.filterString.toLowerCase().trim();
      draft.minQuality = draft.minQuality.trim();
    },
    store,
  );

  createEffect(
    () => deep(store),
    (store) => {
      const storeSnapshot = snapshot(store);
      localStorage.setItem(
        "filters",
        JSON.stringify({
          ...storeSnapshot,
          // filter string is never saved
          // it should always be reset on load
          filterString: "",
        }),
      );
    },
  );

  return (
    <FilterStoreContext value={{ store: trimmedStore, setStore }}>
      {props.children}
    </FilterStoreContext>
  );
};
