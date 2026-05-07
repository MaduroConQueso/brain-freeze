import { getBasePathAndFileName } from "../utils/getFolderAndFileName";
import { Download, Downloads } from "./api/download";

export type DownloadResult = {
  fetchedAt: number;
  activeOnly: boolean;
  fileCount: number;
  groupCount: number;
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
  downloadStatus: "Finished" | "Paused" | "Queued" | string;
};

export function collateDownloadResults(downloads: Downloads): DownloadResult {
  const downloadGroup = new Map<string, DownloadGroup>();
  const now = Date.now();

  for (const download of downloads.items) {
    const { user, sourcePath, targetPath, filename } =
      downloadGroupKey(download);
    const groupKey = `${user}-${sourcePath}-${targetPath}`;

    if (!downloadGroup.has(groupKey)) {
      downloadGroup.set(groupKey, {
        username: user,
        sourcePath,
        targetPath,
        items: [],
      });
    }

    downloadGroup.get(groupKey)?.items.push({
      filename,
      fullSourcePath: download.virtual_path,
      fullTargetPath: download.folder_path,
      currentSpeed: download.speed,
      averageSpeed: download.avg_speed,
      timeElapsed: download.time_elapsed,
      timeLeft: download.time_left,
      progressPercentage: download.progress_pct,
      queuePosition: download.queue_position,
      downloadStatus: download.status as Download["status"],
    });
  }

  return {
    fetchedAt: now,
    activeOnly: downloads.active_only,
    fileCount: downloads.count,
    groupCount: downloadGroup.size,
    groups: Array.from(downloadGroup.values()),
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
