import { Component, For, useContext } from "solid-js";

import { SettingsStoreContext, themeMap } from "../stores/SettingsStore";
import { Dialog } from "./Dialog";

import formStyles from "./Form.module.css";
import styles from "./SettingsDialog.module.css";

export const SettingsDialog: Component<{ id: string; onClose?: () => void }> = (
  props,
) => {
  const { store, setStore } = useContext(SettingsStoreContext);

  return (
    <Dialog
      id={props.id}
      contentClass={styles.settingsDialogContent}
      onClose={props.onClose}
    >
      <label class={formStyles.multiline}>
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
      <label class={formStyles.multiline}>
        <span>Download Folder (full path)</span>
        <span class={formStyles.subtitle}>
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
      <label class={formStyles.multiline}>
        <span>Theme</span>
        <select
          name="theme"
          value={store.theme}
          onChange={(e) =>
            setStore((settings) => {
              settings.theme = e.target.value as keyof typeof themeMap;
            })
          }
        >
          <For each={Object.entries(themeMap)}>
            {keyMap => (
              <option value={keyMap()[0]}>
                {keyMap()[1]}
              </option>
            )}
          </For>
        </select>
      </label>
    </Dialog>
  );
};
