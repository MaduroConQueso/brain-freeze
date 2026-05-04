import { Component } from "solid-js";
import { useSettingsStore } from "../stores/SettingsStore";
import { Dialog } from "./Dialog";

import styles from "./SettingsDialog.module.css";

export const SettingsDialog: Component<{ id: string; onClose?: () => void }> = (
  props,
) => {
  const { store, setStore } = useSettingsStore();

  return (
    <Dialog
      id={props.id}
      contentClass={styles.settingsDialogContent}
      onClose={props.onClose}
    >
      <label class={styles.multiline}>
        <span>API Endpoint</span>
        <input
          type="text"
          name="apiEndpoint"
          placeholder="https://my-server:12339/"
          value={store.apiEndpoint}
          onBlur={(e) =>
            setStore((settings) => {
              settings.apiEndpoint = e.target.value;
            })
          }
        />
      </label>
      <label class={styles.multiline}>
        <span>Download Folder (full path)</span>
        <span class={styles.subtitle}>
          If you leave this blank, all downloaded files will be saved unsorted
          to the default download folder.
        </span>
        <input
          type="text"
          name="downloadFolder"
          placeholder="/path/to/download/folder/complete"
          value={store.downloadFolder}
          onBlur={(e) =>
            setStore((settings) => {
              settings.downloadFolder = e.target.value;
            })
          }
        />
      </label>
      <label class={styles.singleline}>
        <input
          type="checkbox"
          name="smartSort"
          checked={store.smartSort}
          onChange={(e) =>
            setStore((settings) => {
              settings.smartSort = e.target.checked;
            })
          }
        />
        <span>Enable smart-sort</span>
      </label>
    </Dialog>
  );
};
