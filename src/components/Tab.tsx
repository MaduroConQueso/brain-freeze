import { useLocation, useNavigate } from "@solidjs/router";
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
  const navigate = useNavigate();
  const location = useLocation();

  createEffect(
    () => settings.apiEndpoint,
    (endpoint) => {
      if (!endpoint) {
        setActiveTab("settings");
        navigate("/settings");
      }
    },
  );

  onSettled(() => {
    if (location.pathname && location.pathname !== "/") {
      setActiveTab(location.pathname.replace("/", "") as Tabs);
    }
  });

  // createEffect(
  //   () => activeTab(),
  //   (tab) => {
  //     if (tab === "settings") {
  //       const dialog = document.getElementById(
  //         "settings-dialog",
  //       ) as HTMLDialogElement;
  //       dialog?.showModal();
  //     }
  //   },
  // );

  return (
    <div class={styles.tabBar}>
      <Tab id="search" route="/" name="Search" />
      <Tab id="downloads" route="/downloads" name="Downloads" />
      <Tab id="uploads" route="/uploads" name="Uploads" />
      <Tab id="settings" route="/settings" name="Settings" />
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
  route?: string;

  command?: JSX.ButtonHTMLAttributes<HTMLButtonElement>["command"];
  commandfor?: JSX.ButtonHTMLAttributes<HTMLButtonElement>["commandfor"];
};

const Tab: Component<TabProps> = (props) => {
  const navigate = useNavigate();

  const onClick = () => {
    setActiveTab(props.id);
    if (props.route) {
      navigate(props.route);
    }
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
