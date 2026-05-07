export type EnqueueDownloadArgs = {
  username: string;
  virtual_path: string;
  folder_path?: string;
  /** Size of file in bytes. We include this otherwise Nicotine won't be able to track download progress. */
  size?: number;
  /** Nicotine similarly uses this to show additional metadata during donwloads. */
  file_attributes?: Record<string, number>;
  bypass_filter?: boolean;
};

export type EnqueuedDownload = EnqueueDownloadArgs & {
  queued: true;
  duplicate: boolean;
  status: string;
};

export async function enqueueDownload(
  endpoint: string,
  {
    username,
    virtual_path,
    folder_path,
    size,
    file_attributes,
    bypass_filter = false,
  }: EnqueueDownloadArgs,
): Promise<EnqueuedDownload> {
  const url = new URL("/downloads/enqueue", endpoint);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      virtual_path,
      folder_path,
      size,
      file_attributes,
      bypass_filter,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to enqueue download: ${response.statusText}`);
  }

  const data = await response.json();
  return data as EnqueuedDownload;
}

export type Downloads = {
  active_only: boolean;
  count: number;
  items: Download[];
};

export type Download = Required<
  Pick<EnqueuedDownload, "username" | "virtual_path" | "folder_path" | "size">
> & {
  current_byte_offset: number;
  speed: number;
  avg_speed: number;
  time_elapsed: number;
  time_left: number;
  queue_position: 0;
  status: string;
  progress_pct: number;
};

export async function getDownloads(
  endpoint: string,
  activeOnly: boolean = false,
): Promise<Downloads> {
  const url = new URL("/downloads", endpoint);
  const params = new URLSearchParams({ active_only: String(activeOnly) });
  url.search = params.toString();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get downloads: ${response.statusText}`);
  }

  const data = await response.json();
  return data as Downloads;
}
