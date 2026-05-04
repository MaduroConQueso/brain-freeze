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
          placeholder="API Endpoint"
          value={store.apiEndpoint}
          onChange={(e) =>
            setStore((settings) => {
              settings.apiEndpoint = e.target.value;
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
