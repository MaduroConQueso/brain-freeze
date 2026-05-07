import { getFolderAndFileName } from "../utils/getFolderAndFileName";
import { getSearchResults, SearchItem } from "./api/search";

export type CollatedSearchResults = {
  atLimit: boolean;
  prefilterCount: number;
  postfilterCount: number;
  responses: UserResponse[];
};

export type UserResponse = {
  username: string;
  isPrivate: boolean;
  freeUploadSlots: boolean;
  queuePosition: number;
  uploadSpeed: number;

  folders: Record<string, UserFile[]>;
};

export type UserFile = {
  folderName: string;
  fileName: string;
  extension: string;
  /**
   * - 0: lossy compression kbps
   * - 1: duration in seconds
   * - 2: ??? have only seen as '0' - might mean VBR
   * - 3: n/a
   * - 4: lossless sampling rate (eg 44100)
   * - 5: lossless bit depth (eg 16)
   */
  attributes: Record<string, number>;
  fullPath: string;
  sizeInBytes: number;
};

export async function* collateAllSearchResults(
  token: number,
  apiEndpoint: string,
  limit: number = 1000,
) {
  let remainingAttempts = 10;
  while (remainingAttempts > 0) {
    console.log("attempting refresh", remainingAttempts);
    const results = await collateSearchResults(token, apiEndpoint, limit);
    yield results;

    if (results.atLimit) {
      break;
    } else {
      remainingAttempts--;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}

async function collateSearchResults(
  token: number,
  apiEndpoint: string,
  limit: number = 1000,
): Promise<Omit<CollatedSearchResults, "prefilterCount" | "postfilterCount">> {
  const results = await getSearchResults(apiEndpoint, { token, limit });

  // might be overwrought
  // I believe ES2015 now preserves insertion order for objects
  const usernameIndexLookup: Record<string, number> = {};
  const userResponses: UserResponse[] = [];

  const getOrMakeUser = (item: SearchItem): UserResponse => {
    if (usernameIndexLookup[item.username] !== undefined) {
      return userResponses[usernameIndexLookup[item.username]];
    } else {
      const userResponse: UserResponse = {
        username: item.username,
        isPrivate: item.is_private,
        freeUploadSlots: item.free_upload_slots,
        queuePosition: item.queue_position,
        uploadSpeed: item.upload_speed,
        folders: {},
      };

      usernameIndexLookup[userResponse.username] = userResponses.length;
      userResponses.push(userResponse);

      return userResponse;
    }
  };

  for (const item of results.items) {
    const userResponse = getOrMakeUser(item);

    const [folderName, fileName] = getFolderAndFileName(item.file_path);
    const folder: UserFile[] = userResponse.folders[folderName] ?? [];
    folder.push({
      folderName,
      fileName,
      extension: item.extension,
      attributes: item.file_attributes,
      fullPath: item.file_path,
      sizeInBytes: item.size,
    });

    userResponse.folders[folderName] = folder;
  }

  const wasAgo = Math.abs(Date.now() - results.created_at * 1000) > 120000; // milliseconds
  const atLimit =
    // if the server says there's no more results
    // and it's been more than two minutes since we last asked
    // we're at the limit
    (wasAgo && results.count >= results.total) ||
    // if we hit the search limit, we're at the limit
    results.count >= results.limit;

  return {
    atLimit,
    responses: userResponses,
  };
}
