import {
  createContext,
  createEffect,
  createStore,
  deep,
  ParentComponent,
  snapshot,
} from "solid-js";

import { StoreObject } from "../utils/types";

export const themeMap = {
  rosePine: "Rose Pine",
  modus: "Modus",
};

export type SettingsStore = {
  apiEndpoint: string;
  downloadFolder: string;
  theme: keyof typeof themeMap;
};

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
    },
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
