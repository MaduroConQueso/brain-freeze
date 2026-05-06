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
