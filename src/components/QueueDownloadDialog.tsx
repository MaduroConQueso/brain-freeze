import { action, Component } from "solid-js";
import { Dialog } from "./Dialog";
import { UserFile, UserResponse } from "../stores/SearchStore";

import dialogStyles from "./Dialog.module.css";
import { enqueueDownload } from "../api/download";
import { useSettingsStore } from "../stores/SettingsStore";

export type QueueDownloadDialogProps = {
  id: string;
  response: UserResponse;
  folderName: string;
  files: UserFile[];

  onClose?: () => void;
};

export const QueueDownloadDialog: Component<QueueDownloadDialogProps> = (
  props,
) => {
  const { store: settings } = useSettingsStore();

  const downloadFolder = action(async function* (
    username: string,
    filePaths: string[],
  ) {
    const results = await Promise.all(
      filePaths.map((filePath) =>
        enqueueDownload(settings.apiEndpoint, {
          username,
          virtual_path: filePath,
          bypass_filter: false,
        }),
      ),
    );
    yield;

    return results;
  });

  const onDownload = async () => {
    await downloadFolder(
      props.response.username,
      props.files.map((file) => file.fullPath),
    );

    const dialog = document.getElementById(
      props.id,
    ) as HTMLDialogElement | null;
    if (dialog) dialog.close();
  };

  return (
    <Dialog
      id={props.id}
      onClose={props.onClose}
      additionalFooter={
        <>
          <button class={dialogStyles.button} onClick={onDownload}>
            Download
          </button>
        </>
      }
    ></Dialog>
  );
};
