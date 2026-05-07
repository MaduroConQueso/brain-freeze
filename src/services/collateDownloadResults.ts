import { getBasePathAndFileName } from "../utils/getFolderAndFileName";
import { Download, Downloads } from "./api/download";

export type DownloadResult = {
  fetchedAt: number;
  activeOnly: boolean;
  fileCount: number;
  groupCount: number;
  hasActiveDownloads: boolean;
  hasQueuedDownloads: boolean;
  groups: DownloadGroup[];
};

export type DownloadGroup = {
  username: string;
  /** target download folder, assuming every download in a group goes to the same target folder */
  targetPath: string;
  /** source path from uploader's file system */
  sourcePath: string;

  items: DownloadItem[];
};

export type DownloadItem = {
  filename: string;
  fullTargetPath: string;
  fullSourcePath: string;

  currentSpeed: number;
  averageSpeed: number;
  timeElapsed: number;
  timeLeft: number;
  progressPercentage: number;

  queuePosition: number;
  downloadStatus: "Finished" | "Paused" | "Queued" | "Transferring" | string;
};

export function collateDownloadResults(downloads: Downloads): DownloadResult {
  const downloadGroups = new Map<string, DownloadGroup>();
  const now = Date.now();
  let hasActiveDownloads = false;
  let hasQueuedDownloads = false;

  for (const download of downloads.items) {
    const { user, sourcePath, targetPath, filename } =
      downloadGroupKey(download);
    const groupKey = `${user}-${sourcePath}-${targetPath}`;

    if (!downloadGroups.has(groupKey)) {
      downloadGroups.set(groupKey, {
        username: user,
        sourcePath,
        targetPath,
        items: [],
      });
    }

    downloadGroups.get(groupKey)?.items.push({
      filename,
      fullSourcePath: download.virtual_path,
      fullTargetPath: download.folder_path,
      currentSpeed: download.speed,
      averageSpeed: download.avg_speed,
      timeElapsed: download.time_elapsed,
      timeLeft: download.time_left,
      progressPercentage: download.progress_pct || 0,
      queuePosition: download.queue_position,
      downloadStatus: download.status as Download["status"],
    });

    if (download.status === "Transferring") hasActiveDownloads = true;
    if (download.status === "Queued") hasQueuedDownloads = true;
  }

  const [active, completed] = downloadGroups.values().reduce(
    (acc, download) => {
      if (download.items.every((item) => item.downloadStatus === "Finished"))
        acc[1].push(download);
      else acc[0].push(download);
      return acc;
    },
    [[] as DownloadGroup[], [] as DownloadGroup[]],
  );

  return {
    fetchedAt: now,
    activeOnly: downloads.active_only,
    fileCount: downloads.count,
    groupCount: downloadGroups.size,
    groups: active.concat(completed),
    hasActiveDownloads: hasActiveDownloads,
    hasQueuedDownloads: hasQueuedDownloads,
  };
}

function downloadGroupKey(download: Download): {
  user: string;
  sourcePath: string;
  targetPath: string;
  filename: string;
} {
  const [sourcePath, filename] = getBasePathAndFileName(download.virtual_path);
  const [targetPath] = getBasePathAndFileName(download.folder_path);

  return {
    user: download.username,
    sourcePath,
    targetPath,
    filename,
  };
}
