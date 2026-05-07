import { Loading, ParentComponent, type Component } from "solid-js";

import { SearchBar } from "./components/SearchBar";
import { SearchResults } from "./components/SearchResults";
import { TabBar } from "./components/Tab";
import { FilterStoreProvider } from "./stores/FilterStore";
import { SearchStoreProvider } from "./stores/SearchStore";
import { SettingsStoreProvider } from "./stores/SettingsStore";
import { HashRouter, Route } from "@solidjs/router";
import { SettingsPage } from "./components/SettingsPage";
import { DownloadPage } from "./components/DownloadPage";

const Snapp: Component = () => {
  return (
    <HashRouter root={Base} explicitLinks={true}>
      <Route path="/" component={Search} />
      <Route path="/downloads" component={Downloads} />
      <Route path="/uploads" component={Uploads} />
      <Route path="/settings" component={Settings} />
    </HashRouter>
  );
};

const Base: ParentComponent = (props) => {
  return (
    <SettingsStoreProvider>
      <FilterStoreProvider>
        <SearchStoreProvider>
          {props.children}
          <TabBar />
        </SearchStoreProvider>
      </FilterStoreProvider>
    </SettingsStoreProvider>
  )
}

const Search: Component = () => {
  return (
    <>
      <Loading>
        <SearchBar />
        <SearchResults />
      </Loading>
    </>
  )
}

const Downloads: Component = () => {
  return (
    <DownloadPage />
  )
}

const Uploads: Component = () => {
  return (
    <div>
      <h1>Uploads</h1>
    </div>
  )
}

const Settings: Component = () => {
  return (
    <SettingsPage />
  )
}

export default Snapp;
