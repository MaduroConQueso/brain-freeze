import {
  Component,
  createMemo,
  For,
  Loading,
  Show,
  useContext,
} from "solid-js";

import { getDownloads } from "../services/api/download";
import {
  collateDownloadResults,
  DownloadGroup,
  DownloadItem,
  DownloadResult,
} from "../services/collateDownloadResults";
import { SettingsStoreContext } from "../stores/SettingsStore";
import { getFolderAndFileName } from "../utils/getFolderAndFileName";

import styles from "./DownloadPage.module.css";
import pageStyles from "./Page.module.css";

export const DownloadPage: Component = () => {
  const { store: settings } = useContext(SettingsStoreContext);
  const downloads = createMemo<DownloadResult | undefined>(
    async (prev = undefined) => {
      if (!settings.apiEndpoint) return prev;

      const rawDownloads = await getDownloads(settings.apiEndpoint, false);
      return collateDownloadResults(rawDownloads);
    },
  );

  return (
    <main class={pageStyles.page}>
      <Loading>
        <Show when={downloads()}>
          {(downloads) => (
            <For each={downloads().groups}>
              {(item) => <DownloadGroupItem group={item()} />}
            </For>
          )}
        </Show>
      </Loading>
    </main>
  );
};

const DownloadGroupItem: Component<{ group: DownloadGroup }> = (props) => {
  const [, sourceParentFolder] = getFolderAndFileName(props.group.sourcePath);

  return (
    <article class={styles.group}>
      <header>
        <h2>
          /{props.group.username}/<strong>{sourceParentFolder}</strong>/
        </h2>
      </header>
      <ul>
        <For each={props.group.items}>
          {(item) => <Download item={item()} />}
        </For>
      </ul>
    </article>
  );
};

const statusIconMap: Record<DownloadItem["downloadStatus"], string> = {
  Finished: "✔",
  Paused: "⏸",
  Queued: "◷",
};

const Download: Component<{ item: DownloadItem }> = (props) => {
  return (
    <li class={styles.download}>
      <div class={styles.trackName} title={props.item.filename}>
        <span class={styles.statusIcon}>
          {statusIconMap[props.item.downloadStatus]}
        </span>
        {props.item.filename}
      </div>
      <div class={styles.details}></div>
    </li>
  );
};
