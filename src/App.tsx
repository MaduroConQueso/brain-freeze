import { type Component } from "solid-js";

import { SearchBar } from "./components/SearchBar";
import { SearchResults } from "./components/SearchResults";
import { TabBar } from "./components/Tab";
import { SearchStoreProvider } from "./stores/SearchStore";
import { SettingsStoreProvider } from "./stores/SettingsStore";

const Snapp: Component = () => {
  return (
    <SettingsStoreProvider>
      <SearchStoreProvider>
        <SearchBar />
        <SearchResults />
        <TabBar />
      </SearchStoreProvider>
    </SettingsStoreProvider>
  );
};

export default Snapp;
