import {
  createContext,
  createEffect,
  createStore,
  deep,
  ParentComponent,
  snapshot,
} from "solid-js";

import { StoreObject } from "../utils/types";

export type SettingsStore = {
  apiEndpoint: string;
  downloadFolder: string;
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
    },
  );

  createEffect(
    () => deep(store),
    (store) => {
      const storeSnapshot = snapshot(store);
      localStorage.setItem("settings", JSON.stringify(storeSnapshot));
    },
  );

  return (
    <SettingsStoreContext value={{ store, setStore }}>
      {props.children}
    </SettingsStoreContext>
  );
};
