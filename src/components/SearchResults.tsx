import {
  createMemo,
  createSignal,
  Errored,
  For,
  Loading,
  onSettled,
  Show,
  useContext,
  type Component,
} from "solid-js";

import {
  SearchStoreContext,
  UserFile,
  UserResponse,
} from "../stores/SearchStore";
import {
  QueueDownloadDialog,
  QueueDownloadDialogProps,
} from "./QueueDownloadDialog";

import styles from "./SearchResults.module.css";

export const SearchResults: Component = () => {
  const { searchResults } = useContext(SearchStoreContext);

  const [queueDialogProps, setQueueDialogProps] =
    createSignal<Omit<QueueDownloadDialogProps, "onClose">>();

  const closeQueueDialog = () => {
    setQueueDialogProps(undefined);
  };

  const openQueueDialog = (
    props: Omit<QueueDownloadDialogProps, "onClose">,
  ) => {
    setQueueDialogProps(props);
    onSettled(() => {
      const dialog = document.getElementById(
        props.id,
      ) as HTMLDialogElement | null;
      if (dialog) {
        dialog.showModal();
      }
    });
  };

  return (
    <main class={styles.searchResults}>
      <Errored fallback={(error) => <pre>{error()}</pre>}>
        <Loading>
          <For each={searchResults()?.responses}>
            {(response) => (
              <UserItems
                response={response()}
                setQueueDialogProps={openQueueDialog}
              />
            )}
          </For>
        </Loading>
      </Errored>
      <Show when={queueDialogProps()}>
        {(props) => (
          <QueueDownloadDialog
            id={props().id}
            response={props().response}
            folderName={props().folderName}
            files={props().files}
            onClose={closeQueueDialog}
          />
        )}
      </Show>
    </main>
  );
};

const UserItems: Component<{
  response: UserResponse;
  setQueueDialogProps: (props: QueueDownloadDialogProps) => void;
}> = (props) => {
  const folders = createMemo(() => Object.entries(props.response.folders));

  return (
    <article class={styles.user}>
      <For each={folders()}>
        {(entry) => (
          <UserFolder
            response={props.response}
            folderName={entry()[0]}
            files={entry()[1]}
            setQueueDialogProps={props.setQueueDialogProps}
          />
        )}
      </For>
    </article>
  );
};

const UserFolder: Component<{
  response: UserResponse;
  folderName: string;
  files: UserFile[];
  setQueueDialogProps: (props: QueueDownloadDialogProps) => void;
}> = (props) => {
  const speed = () => parseSpeed(props.response.uploadSpeed);

  const downloadId = () =>
    `download-${props.response.username}-${props.folderName}`;

  const onClickFolder = () => {
    props.setQueueDialogProps({
      id: downloadId(),
      response: props.response,
      folderName: props.folderName,
      files: props.files,
    });
  };

  return (
    <div class={styles.folder} onClick={onClickFolder}>
      <header class={styles.folderHeader}>
        <div class={styles.folderHeaderInner}>
          <div class={styles.folderPath}>
            /{props.response.username}/
            <strong class={styles.folderName}>{props.folderName}</strong>/
          </div>
          <div class={styles.folderDetails}>
            <Show when={props.response.isPrivate}>
              <span class={styles.private}>private</span>
            </Show>
            <Show when={props.response.queuePosition > 0}>
              <span class={styles.queue}>
                {props.response.queuePosition} in line
              </span>
            </Show>
            <span class={styles.speed}>{speed()} MiB/s</span>
          </div>
        </div>
      </header>
      <For each={props.files}>{(file) => <Track file={file()} />}</For>
    </div>
  );
};

const Track: Component<{ file: UserFile }> = (props) => {
  const duration = createMemo(() => {
    const seconds = props.file.attributes[1];
    if (Number.isInteger(seconds)) {
      return secondsToMSS(seconds);
    }

    return undefined;
  });

  const quality = createMemo(() => {
    const bitRate = props.file.attributes[0];
    if (Number.isFinite(bitRate)) {
      return `${bitRate} KB/s`;
    }

    const sampleRate = props.file.attributes[4];
    const bitDepth = props.file.attributes[5];
    if (Number.isFinite(bitDepth) && Number.isFinite(sampleRate)) {
      return `${bitDepth}/${sampleRate / 1000}kHz`;
    }

    return undefined;
  });

  return (
    <div class={styles.track}>
      <div class={styles.trackName}>{props.file.fileName}&nbsp;</div>

      <Show when={duration()}>
        <div class={styles.trackDetails}>{duration()}&nbsp;</div>
      </Show>
      <Show when={quality()}>
        <div class={styles.trackDetails}>{quality()}</div>
      </Show>
    </div>
  );
};

function parseSpeed(speedBitsPerSecond: number): string {
  return (speedBitsPerSecond / 1048576.0).toPrecision(3);
}

function secondsToMSS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const ss = seconds - m * 60;

  return `${m}:${ss < 10 ? "0" + ss : ss}`;
}
