import { type Component } from "solid-js";

import { SearchBar } from "./components/SearchBar";
import { SearchResults } from "./components/SearchResults";
import { TabBar } from "./components/Tab";
import { FilterStoreProvider } from "./stores/FilterStore";
import { SearchStoreProvider } from "./stores/SearchStore";
import { SettingsStoreProvider } from "./stores/SettingsStore";

const Snapp: Component = () => {
  return (
    <SettingsStoreProvider>
      <FilterStoreProvider>
        <SearchStoreProvider>
          <SearchBar />
          <SearchResults />
          <TabBar />
        </SearchStoreProvider>
      </FilterStoreProvider>
    </SettingsStoreProvider>
  );
};

export default Snapp;
