import { 
  Component, 
  For, 
  Match, 
  Show, 
  Switch, 
  useContext 
} from "solid-js";
import { supportsRescan } from "../utils/apiVersionUtil";
import { rescan } from "../services/api/rescan";
import { SettingsStoreContext, themeMap } from "../stores/SettingsStore";
import formStyles from "./Form.module.css";
import pageStyles from "./Page.module.css";
import styles from "./SettingsPage.module.css";

export const SettingsPage: Component = () => {
  const { store, setStore } = useContext(SettingsStoreContext);
  return (
    <main class={pageStyles.page}>
      <h1>settings</h1>
      <label class={formStyles.multiline}>
        <span>API Endpoint</span>
        <div class={styles.endpointField}>
          <input
            type="text"
            name="apiEndpoint"
            placeholder="https://my-server:12339/"
            value={store.apiEndpoint}
            onBlur={(e) => {
              setStore((settings) => {
                settings.apiEndpoint = e.target.value;
              });
            }}
          />
          <Switch>
            <Match when={store.isApiEndpointHealthy}>
              <span
                class={styles.endpointIcon}
                style={{ color: "#2f9e44" }}
                aria-label="API endpoint is valid"
                title="API endpoint is valid">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
            </Match>
            <Match when={!store.isApiEndpointHealthy}>
              <span
                class={styles.endpointIcon}
                style={{ color: "#e03131" }}
                aria-label="API endpoint is invalid"
                title="API endpoint is invalid">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </span>
            </Match>
          </Switch>
        </div>
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
            {(keyMap) => <option value={keyMap()[0]}>{keyMap()[1]}</option>}
          </For>
        </select>
      </label>
      <Show when={store.isApiEndpointHealthy && supportsRescan(store.apiVersion)}>
        <label class={formStyles.multiline}>
          <span>Rescan Files</span>
          <span class={formStyles.subtitle}> Triggers a rescan on the client.</span>
          <button class={styles.button} onClick={() => { if (store.isApiEndpointHealthy) rescan(store.apiEndpoint) }}>
            Rescan
          </button>
        </label>
      </Show>
    </main>
  );
};
