import {
  Component,
  createEffect,
  createMemo,
  For,
  Loading,
  Match,
  refresh,
  Show,
  Switch,
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

  createEffect(
    () => [downloads()?.hasActiveDownloads, downloads()?.hasQueuedDownloads],
    ([hasActiveDownloads, hasQueuedDownloads]) => {
      let refreshTimer = 60 * 1000;
      if (hasQueuedDownloads) refreshTimer = 10 * 1000;
      if (hasActiveDownloads) refreshTimer = 1.5 * 1000;

      const timer = setTimeout(() => {
        refresh(downloads);
      }, refreshTimer);

      return () => clearTimeout(timer);
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
  Queued: "∞",
  Transferring: "▶",
};

const Download: Component<{ item: DownloadItem }> = (props) => {
  const isProbablyErrorStatus = () =>
    props.item.downloadStatus.indexOf(" ") !== -1;

  const paddedProgress = () => props.item.progressPercentage.toFixed(1);

  return (
    <li class={styles.download}>
      <div class={styles.trackName} title={props.item.filename}>
        <span class={styles.statusIcon}>
          {statusIconMap[props.item.downloadStatus] || "✖"}
        </span>
        {props.item.filename}
      </div>
      <Show when={props.item.downloadStatus !== "Finished"}>
        {
          <div class={styles.details}>
            <Show when={!isProbablyErrorStatus()}>
              <div class={styles.progressBar}>
                <div
                  class={styles.progress}
                  style={{ width: `${props.item.progressPercentage}%` }}
                ></div>
              </div>

              <span>{paddedProgress()}%</span>
            </Show>
            <Switch>
              <Match when={props.item.downloadStatus === "Paused"}>
                <span class={styles.statusText}>Paused</span>
              </Match>
              <Match when={props.item.downloadStatus === "Queued"}>
                <span class={styles.statusText}>Queued</span>
              </Match>
              <Match when={props.item.downloadStatus === "Transferring"}>
                <span class={styles.statusText}>Downloading</span>
              </Match>
              <Match when={isProbablyErrorStatus}>
                <span class={styles.statusText}>
                  <strong>{props.item.downloadStatus}</strong>
                </span>
              </Match>
            </Switch>
          </div>
        }
      </Show>
    </li>
  );
};
