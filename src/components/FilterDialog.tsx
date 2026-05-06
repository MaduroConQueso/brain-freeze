import { Component, For, useContext } from "solid-js";

import {
  FileType,
  fileTypeMap,
  FilterStoreContext,
  Sort,
  SortDirection,
  sortDirectionMap,
  sortMap,
} from "../stores/FilterStore";
import { Dialog } from "./Dialog";

import styles from "./FilterDialog.module.css";
import formStyles from "./Form.module.css";

export const FilterDialog: Component<{ id: string; onClose?: () => void }> = (
  props,
) => {
  const { store, setStore } = useContext(FilterStoreContext);

  return (
    <Dialog id={props.id} contentClass={styles.content} onClose={props.onClose}>
      <label class={formStyles.multiline}>
        <span>Filter text</span>
        <input
          type="search"
          enterkeyhint="search"
          name="filterText"
          placeholder="Filters download results by entire string"
          value={store.filterString}
          // when the user types enter, blur the input to trigger the filter update
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          onBlur={(e) =>
            setStore((filters) => void (filters.filterString = e.target.value))
          }
        />
      </label>
      <label class={formStyles.multiline}>
        <span>Sort</span>
        <select
          name="sort"
          value={store.sort}
          onChange={(e) =>
            setStore((filters) => void (filters.sort = e.target.value as Sort))
          }
        >
          <For each={Object.entries(sortMap)}>
            {(entry) => <option value={entry()[0]}>{entry()[1]}</option>}
          </For>
        </select>
      </label>
      <label class={formStyles.multiline}>
        <span>Sort direction</span>
        <select
          name="sortDirection"
          value={store.sortDirection}
          onChange={(e) =>
            setStore(
              (filters) =>
                void (filters.sortDirection = e.target.value as SortDirection),
            )
          }
        >
          <For each={Object.entries(sortDirectionMap)}>
            {(entry) => <option value={entry()[0]}>{entry()[1]}</option>}
          </For>
        </select>
      </label>
      <label class={formStyles.multiline}>
        <span>File type</span>
        <select
          name="fileType"
          value={store.fileType}
          onChange={(e) =>
            setStore(
              (filters) => void (filters.fileType = e.target.value as FileType),
            )
          }
        >
          <For each={Object.entries(fileTypeMap)}>
            {(entry) => <option value={entry()[0]}>{entry()[1]}</option>}
          </For>
        </select>
      </label>
      <label class={formStyles.multiline}>
        <span>Minimum quality</span>
        <span class={formStyles.subtitle}>
          For lossy files, minimum bitrate in KB/s (192). For lossless, minimum
          bit depth over sample rate in MHz (16/44.1).
        </span>
        <input
          type="text"
          name="minQuality"
          placeholder="256, 16/44.1"
          value={store.minQuality}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          onBlur={(e) =>
            setStore((filters) => void (filters.minQuality = e.target.value))
          }
        />
      </label>
      <label class={formStyles.multiline}>
        <span>Minimum files in folder</span>
        <input
          type="number"
          name="minFilesInFolder"
          placeholder="0"
          min="0"
          value={store.minFilesInFolder}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          onBlur={(e) =>
            setStore(
              (filters) =>
                void (filters.minFilesInFolder = Number(e.target.value)),
            )
          }
        />
      </label>
      <label class={formStyles.singleline}>
        <input
          type="checkbox"
          name="hideQueue"
          checked={store.hideQueue}
          onChange={(e) =>
            setStore((filters) => void (filters.hideQueue = e.target.checked))
          }
        />
        <span>Hide downloads with a queue</span>
      </label>
      <label class={formStyles.singleline}>
        <input
          type="checkbox"
          name="hidePrivate"
          checked={store.hidePrivate}
          onChange={(e) =>
            setStore((filters) => void (filters.hidePrivate = e.target.checked))
          }
        />
        <span>Hide private downloads</span>
      </label>
    </Dialog>
  );
};
