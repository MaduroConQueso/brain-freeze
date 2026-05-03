import { SettingsStoreProvider } from "../stores/SettingsStore";

export interface QueuedSearch {
  query: string;
  token: number;
}

export async function postSearch(
  endpoint: string,
  query: string,
): Promise<QueuedSearch> {
  const result = await fetch(new URL("search", endpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: query,
    }),
  });

  return result.json();
}

export interface HistoricalSearch extends QueuedSearch {
  created_at: number;
  result_count: number;
}

export async function getSearchHistory(
  endpoint: string,
): Promise<HistoricalSearch[]> {
  const result = await fetch(new URL("searches", endpoint), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = await result.json();
  return json.items;
}

export interface GetSearchResultsArgs {
  token?: number;
  limit?: number;
  offset?: number;
}

export interface SearchResults {
  token: number;
  query: string;
  created_at: number;
  total: number;
  offset: number;
  limit: number;
  count: number;
  items: SearchItem[];
}

export interface SearchItem {
  username: string;
  file_path: string;
  size: number;
  extension: string;
  is_private: boolean;
  free_upload_slots: boolean;
  queue_position: number;
  upload_speed: number;
  file_attributes: Record<string, number>;
  received_at: number;
}

export async function getSearchResults(
  endpoint: string,
  { token, limit, offset }: GetSearchResultsArgs,
): Promise<SearchResults> {
  const requestUrl = new URL("search/results", endpoint);

  if (token !== undefined)
    requestUrl.searchParams.append("token", String(token));
  if (limit !== undefined)
    requestUrl.searchParams.append("limit", String(limit));
  if (offset !== undefined)
    requestUrl.searchParams.append("offset", String(offset));
  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.json();
}
