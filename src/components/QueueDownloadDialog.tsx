import { Component, useContext } from "solid-js";

import { enqueueDownload } from "../api/download";
import { UserFile, UserResponse } from "../stores/SearchStore";
import { SettingsStoreContext } from "../stores/SettingsStore";
import { Dialog } from "./Dialog";

import dialogStyles from "./Dialog.module.css";

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
  const { store: settings } = useContext(SettingsStoreContext);

  const downloadFolder = async (username: string, files: UserFile[]) => {
    // TODO convert to an action
    // optimistically update DownloadStore when it exists
    const results = await Promise.all(
      files.map((file) =>
        enqueueDownload(settings.apiEndpoint, {
          username,
          virtual_path: file.fullPath,
          folder_path: settings.downloadFolder
            ? `${settings.downloadFolder}/${getParentFolder(file.fullPath)}`
            : undefined,
          bypass_filter: false,
          size: file.sizeInBytes,
          file_attributes: file.attributes,
        }),
      ),
    );

    return results;
  };

  const onDownload = async () => {
    await downloadFolder(
      props.response.username,
      props.files,
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

function getParentFolder(filePath: string): string {
  const path = filePath.split(/[/\\]/);
  if (path.length < 2) return "";
  return path[path.length - 2];
}
