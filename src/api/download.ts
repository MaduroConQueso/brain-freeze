export type EnqueueDownloadArgs = {
  username: string;
  virtual_path: string;
  folder_path?: string;
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
      bypass_filter,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to enqueue download: ${response.statusText}`);
  }

  const data = await response.json();
  return data as EnqueuedDownload;
}
