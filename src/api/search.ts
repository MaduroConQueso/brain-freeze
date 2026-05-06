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
      switch_page: false,
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

  let finalSearchResults: SearchResults | undefined;
  let pageAttempts = 0;
  while (pageAttempts++ < 5) {
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json: SearchResults = await response.json();

    if (finalSearchResults === undefined) finalSearchResults = json;
    else {
      finalSearchResults = {
        ...finalSearchResults,
        offset: 0,
        items: finalSearchResults.items.concat(json.items),
        count: finalSearchResults.count + json.count,
      }
    }

    // if this page has less items than the limit, then there won't be any more pages
    if (json.count < json.limit) break;

    offset = json.offset + json.count;
    requestUrl.searchParams.set("offset", String(offset));
  }

  if (finalSearchResults === undefined) throw new Error("No results found");
  return finalSearchResults;
}
