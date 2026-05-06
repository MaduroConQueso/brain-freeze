import { JSX } from "@solidjs/web/jsx-runtime";
import {
  Component,
  createEffect,
  createSignal,
  onSettled,
  useContext,
} from "solid-js";

import { SettingsStoreContext } from "../stores/SettingsStore";
import { SettingsDialog } from "./SettingsDialog";

import styles from "./Tab.module.css";

export type Tabs = "search" | "downloads" | "uploads" | "settings";

export const [activeTab, setActiveTab] = createSignal<Tabs>("search");

export const TabBar: Component = () => {
  const { store: settings } = useContext(SettingsStoreContext);
  onSettled(() => {
    if (!settings.apiEndpoint) {
      setActiveTab("settings");
    }
  });

  createEffect(
    () => activeTab(),
    (tab) => {
      if (tab === "settings") {
        const dialog = document.getElementById(
          "settings-dialog",
        ) as HTMLDialogElement;
        dialog?.showModal();
      }
    },
  );

  return (
    <div class={styles.tabBar}>
      <Tab id="search" name="Search" />
      <Tab id="downloads" name="Downloads" />
      <Tab id="uploads" name="Uploads" />
      <Tab id="settings" name="Settings" />
      <SettingsDialog
        id="settings-dialog"
        onClose={() => setActiveTab("search")}
      />
    </div>
  );
};

type TabProps = {
  id: Tabs;
  name: string;

  command?: JSX.ButtonHTMLAttributes<HTMLButtonElement>["command"];
  commandfor?: JSX.ButtonHTMLAttributes<HTMLButtonElement>["commandfor"];
};

const Tab: Component<TabProps> = (props) => {
  const onClick = () => {
    setActiveTab(props.id);
  };

  return (
    <button
      class={{
        [styles.tab]: true,
        [styles.tabActive]: activeTab() === props.id,
      }}
      title={props.name}
      onClick={onClick}
      command={props.command}
      commandfor={props.commandfor}
    >
      {props.name}
    </button>
  );
};
