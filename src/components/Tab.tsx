import { Component, createEffect, createSignal } from "solid-js";

import styles from "./Tab.module.css";
import { JSX } from "@solidjs/web/jsx-runtime";
import { SettingsDialog } from "./SettingsDialog";

export type Tabs = "search" | "downloads" | "uploads" | "settings";

export const [activeTab, setActiveTab] = createSignal<Tabs>("settings");

export const TabBar: Component = () => {
  createEffect(
    () => activeTab(),
    (tab, prevTab) => {
      if (tab === "settings") {
        const dialog = document.getElementById(
          "settings-dialog",
        ) as HTMLDialogElement;
        dialog?.showModal();
      }
    },
  );

  return (
    <div class={styles["tab-bar"]}>
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
        [styles["tab-active"]]: activeTab() === props.id,
      }}
      onClick={onClick}
      command={props.command}
      commandfor={props.commandfor}
    >
      {props.name}
    </button>
  );
};
