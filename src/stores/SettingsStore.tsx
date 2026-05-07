import {
  createContext,
  createEffect,
  createStore,
  deep,
  ParentComponent,
  snapshot,
  createMemo,
} from "solid-js";
import { StoreObject } from "../utils/types";
import { getApiVersion } from "../services/api/health";
import { isApiEndpointHealthy } from "../utils/apiVersionUtil";

export const themeMap = {
  rosePine: "Rose Pine",
  modus: "Modus",
};

export type SettingsStore = {
  downloadFolder: string;
  theme: keyof typeof themeMap;
} & EndpointState;

type EndpointState = 
  | { apiEndpoint: string | undefined; isApiEndpointHealthy: false }
  | { apiEndpoint: string; apiVersion: string; isApiEndpointHealthy: true };

export type SettingsStoreContextType = StoreObject<SettingsStore> & {};

export const SettingsStoreContext = createContext<SettingsStoreContextType>(
  {} as SettingsStoreContextType,
);

export const SettingsStoreProvider: ParentComponent = (props) => {
  const [store, setStore] = createStore<SettingsStore>(
    JSON.parse(localStorage.getItem("settings") ?? "null") ?? {
      apiEndpoint: "",
      downloadFolder: "",
      theme: "rosePine",
      isApiEndpointHealthy: false,
      apiVersion: "-1",
    },
  );

  const apiVersion = createMemo(() => getApiVersion(store.apiEndpoint || ""));
  createEffect(
    () => apiVersion(), 
    (apiVersionValue) => setStore((settings) => {
      settings.isApiEndpointHealthy = isApiEndpointHealthy(apiVersionValue);
      if (settings.isApiEndpointHealthy) {
        settings.apiVersion = apiVersionValue;
      }
    })
  );

  createEffect(
    () => deep(store),
    (store) => {
      const storeSnapshot = snapshot(store);
      localStorage.setItem("settings", JSON.stringify(storeSnapshot));
    },
  );

  createEffect(
    () => store.theme,
    (theme) => {
      document.documentElement.className = theme === "rosePine" ? "rose-pine" : "modus";
    },
  );

  return (
    <SettingsStoreContext value={{ store, setStore }}>
      {props.children}
    </SettingsStoreContext>
  );
};