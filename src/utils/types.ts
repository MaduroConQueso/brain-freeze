import { Store, StoreSetter } from "solid-js";

export type StoreObject<T> = {
  store: Store<T>;
  setStore: StoreSetter<T>;
};
